// vercel-proxy-api/api/upload.js
import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';
const PRODUCTION_ORIGIN = 'https://airrick1985.github.io';
const TRUSTED_DEV_ORIGINS = [
  'https://glorious-barnacle-7rpgq4xjx4jfx79p-5173.app.github.dev',
  // 'http://localhost:5173'
];

export default async function handler(req, res) {
  const requestOrigin = req.headers.origin;
  let originToAllow = null;

  console.log(`[upload.js CORS Check] Request Origin: ${requestOrigin}, NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[upload.js CORS Check] TRUSTED_DEV_ORIGINS: ${JSON.stringify(TRUSTED_DEV_ORIGINS)}`);

  if (requestOrigin && TRUSTED_DEV_ORIGINS.includes(requestOrigin)) {
    originToAllow = requestOrigin;
    console.log(`[upload.js CORS Check] Allowing TRUSTED_DEV_ORIGIN: ${originToAllow}`);
  } else if (requestOrigin === PRODUCTION_ORIGIN) {
    originToAllow = PRODUCTION_ORIGIN;
    console.log(`[upload.js CORS Check] Allowing PRODUCTION_ORIGIN: ${originToAllow}`);
  } else if (process.env.NODE_ENV === 'development') {
    if (requestOrigin) {
      originToAllow = requestOrigin;
      console.warn(`[upload.js CORS Check] NODE_ENV=development: Allowing unlisted origin ${requestOrigin}`);
    } else {
      originToAllow = '*';
      console.warn(`[upload.js CORS Check] NODE_ENV=development: No origin header, allowing '*'`);
    }
  }

  if (originToAllow) {
    res.setHeader('Access-Control-Allow-Origin', originToAllow);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log(`[upload.js] Handling OPTIONS request. Allowed origin determined: ${originToAllow || 'NONE (will be blocked if not matched and not dev fallback)'}`);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    console.log(`[upload.js] Method Not Allowed: ${req.method}`);
    return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });
  }

  if (process.env.NODE_ENV !== 'development' && !originToAllow) {
      console.log(`[upload.js] POST request blocked. Origin: ${requestOrigin} not allowed.`);
      return res.status(403).json({ status: 'error', message: 'CORS policy: Origin not allowed for POST request.' });
  }

  const defaultUploadAction = 'upload_photo';
  const { filename, base64, token, projectName, action = defaultUploadAction } = req.body; // 添加 projectName
  console.log(`[upload.js] Received POST - action: ${action}, filename: ${filename ? 'present' : 'missing'}, projectName: ${projectName}, token: ${token ? 'present' : 'missing'}`);

  if (!filename || !base64 || token !== 'anxi111003') {
    console.log('[upload.js] 缺少必要參數或 token 驗證失敗');
    return res.status(400).json({ status: 'error', message: '缺少必要參數或 token 驗證失敗' });
  }

  let gasAction;
  if (action === 'upload_photo') {
    gasAction = 'upload_photo';
  } else if (action === 'upload_signature') {
    gasAction = 'upload_signature';
  } else {
    console.log(`[upload.js] 不支援的上傳 action: ${action}`);
    return res.status(400).json({ status: 'error', message: `不支援的上傳類型: ${action}` });
  }

  // 如果 GAS 端 handleUploadPhoto/handleUploadSignature 需要 projectName (ssId)
  // 則 projectName 必須在此處檢查並包含在 bodyToGas 中
  // 假設 upload 操作不需要 projectName，如果需要，請取消下一行的註釋並調整
  // if (!projectName && (gasAction === 'upload_photo' || gasAction === 'upload_signature')) {
  //   console.log(`[upload.js] Action ${gasAction} 需要 projectName，但未提供。`);
  //   return res.status(400).json({ status: 'error', message: `Action ${gasAction} 需要 projectName 參數。` });
  // }

  const bodyToGas = { action: gasAction, filename, base64, token /*, projectName */ };
  // if (projectName) bodyToGas.projectName = projectName; // 只有當 projectName 存在且需要時才添加

  try {
    console.log('[upload.js] Forwarding to GAS with body (base64 omitted for brevity):', { ...bodyToGas, base64: '...' });
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(bodyToGas)
    });
    const rawText = await gasRes.text();
    if (!gasRes.ok) {
      console.error(`[upload.js] GAS request failed with status ${gasRes.status}. Action: ${gasAction}. Response:`, rawText.substring(0, 500));
      return res.status(gasRes.status).json({
        status: 'error',
        message: `GAS 請求失敗 (action: ${gasAction})，狀態碼: ${gasRes.status}`,
        raw: rawText.substring(0, 500)
      });
    }
    console.log(`[upload.js] GAS response received (Action: ${gasAction}). Length: ${rawText.length}.`);
    try {
      const result = JSON.parse(rawText);
      console.log(`[upload.js] Successfully parsed JSON from GAS (Action: ${gasAction})`);
      return res.status(200).json(result);
    } catch (parseErr) {
      console.error(`[upload.js] JSON parsing error from GAS (Action: ${gasAction}). Error:`, parseErr.message);
      console.error('Original GAS response text (first 1000 chars):', rawText.substring(0, 1000));
      return res.status(500).json({
        status: 'error',
        message: 'GAS 回傳的內容無法解析為 JSON，請檢查 Apps Script 的輸出。',
        action: gasAction,
        rawResponsePreview: rawText.substring(0, 500)
      });
    }
  } catch (err) {
    console.error(`[upload.js] Proxy internal error (Action: ${gasAction}). Error:`, err.message, err.stack);
    return res.status(500).json({ status: 'error', message: `代理伺服器內部錯誤: ${err.message}` });
  }
}
