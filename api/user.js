// vercel-proxy-api/api/user.js
import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';
const PRODUCTION_ORIGIN = 'https://airrick1985.github.io';
const allowedOriginsForDev = [
  'https://glorious-barnacle-7rpgq4xjx4jfx79p-5173.app.github.dev',
  // 'http://localhost:5173'
];

export default async function handler(req, res) {
  console.log(`[user.js Entry] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[user.js Entry] Request Origin Header: ${req.headers.origin}`);
  console.log(`[user.js Entry] Request Method: ${req.method}`);

  const requestOrigin = req.headers.origin;
  let originToAllow = null; // 初始化為 null

  if (requestOrigin === PRODUCTION_ORIGIN) {
    originToAllow = PRODUCTION_ORIGIN;
  } else if (process.env.NODE_ENV === 'development') {
    if (requestOrigin && allowedOriginsForDev.includes(requestOrigin)) {
      originToAllow = requestOrigin;
    } else if (requestOrigin) { // 開發模式下，如果不在白名單，也允許當前請求的源
      originToAllow = requestOrigin;
      console.warn(`[CORS - user.js] Development mode: Allowing unlisted origin ${requestOrigin}`);
    } else {
      // 開發模式下，如果沒有 origin (例如服務器間請求)，可以考慮允許 '*'
      // 但對於瀏覽器發起的預檢請求，origin 應該存在
      originToAllow = '*';
      console.warn(`[CORS - user.js] Development mode: No origin header, allowing '*'`);
    }
  }
  // 如果是生產環境，且 requestOrigin 不是 PRODUCTION_ORIGIN，則 originToAllow 保持 null
  // 這將導致後續的 setHeader 不會設置 Access-Control-Allow-Origin，從而瀏覽器會阻止請求（這是期望的）

  // 始終先設置這些頭部，即使 originToAllow 為 null (瀏覽器會忽略無效的頭)
  // 但更好的做法是只有在 originToAllow 有效時才設置
  if (originToAllow) {
      res.setHeader('Access-Control-Allow-Origin', originToAllow);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // 確保包含所有前端可能發送的頭
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log(`[user.js] Handling OPTIONS request from origin: ${requestOrigin}. Allowed origin: ${originToAllow || 'Not Set (Blocked by default in prod if not matched)'}`);
    // OPTIONS 請求只需要正確的 CORS 頭即可，不需要進一步處理
    return res.status(204).end(); // 通常 OPTIONS 成功響應是 204 No Content
  }

  // --- POST 請求處理邏輯 ---
  if (req.method !== 'POST') {
    console.log(`[user.js] Method Not Allowed: ${req.method}`);
    return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });
  }

  // 如果 originToAllow 為 null (表示生產環境下源不匹配)，則阻止 POST 請求
  if (!originToAllow && process.env.NODE_ENV !== 'development' && requestOrigin !== PRODUCTION_ORIGIN) {
      console.log(`[user.js] CORS check failed for POST request from origin: ${requestOrigin}`);
      return res.status(403).json({ status: 'error', message: 'CORS policy: Origin not allowed.' });
  }


  const { action, projectName, token, ...payload } = req.body;
  console.log(`[user.js] Received POST - action: ${action}, projectName: ${projectName}, token: ${token ? 'present' : 'missing'}`);

  const allowActions = ['login', 'forgot_password', 'update_profile', 'get_project_list'];
  if (!action || !allowActions.includes(action)) {
    console.log(`[user.js] 不支援的 action: ${action}`);
    return res.status(400).json({ status: 'error', message: `不支援的 action: ${action}` });
  }

  if (action === 'login' && !projectName) {
    console.log('[user.js] Login action 需要 projectName，但未提供。');
    return res.status(400).json({ status: 'error', message: '登入請求缺少建案名稱 (projectName) 參數。' });
  }

  const bodyToGas = {
    action,
    projectName: action === 'login' ? projectName : undefined,
    ...payload
  };
  if (bodyToGas.projectName === undefined) {
    delete bodyToGas.projectName;
  }

  try {
    console.log('[user.js] Forwarding to GAS with body:', JSON.stringify(bodyToGas));
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(bodyToGas)
    });

    const rawText = await gasRes.text();

    if (!gasRes.ok) {
      console.error(`[user.js] GAS request failed with status ${gasRes.status}. Action: ${action}. Response:`, rawText.substring(0, 500));
      return res.status(gasRes.status).json({
        status: 'error',
        message: `GAS 請求失敗 (action: ${action})，狀態碼: ${gasRes.status}`,
        raw: rawText.substring(0, 500)
      });
    }

    console.log(`[user.js] GAS response received (Action: ${action}). Length: ${rawText.length}. Preview:`, rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''));

    try {
      const result = JSON.parse(rawText);
      console.log(`[user.js] Successfully parsed JSON from GAS (Action: ${action})`);
      return res.status(200).json(result);
    } catch (parseErr) {
      console.error(`[user.js] JSON parsing error from GAS (Action: ${action}). Error:`, parseErr.message);
      console.error('Original GAS response text (first 1000 chars):', rawText.substring(0, 1000));
      return res.status(500).json({
        status: 'error',
        message: 'GAS 回傳的內容無法解析為 JSON，請檢查 Apps Script 的輸出。',
        action: action,
        rawResponsePreview: rawText.substring(0, 500)
      });
    }
  } catch (err) {
    console.error(`[user.js] Proxy internal error (Action: ${action}). Error:`, err.message, err.stack);
    return res.status(500).json({ status: 'error', message: `代理伺服器內部錯誤: ${err.message}` });
  }
}
