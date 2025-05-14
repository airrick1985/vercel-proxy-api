// vercel-proxy-api/api/upload.js
import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';

export default async function handler(req, res) {
  const requestOrigin = req.headers.origin;
  const allowedOrigins = [
    'https://airrick1985.github.io',
    'https://glorious-barnacle-7rpgq4xjx4jfx79p-5173.app.github.dev',
    // 'http://localhost:5173' // 如果有本地開發，取消註釋並修改端口
  ];

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*');
  }
  // 如果是生產環境且 requestOrigin 不在 allowedOrigins 中，則不設置此頭

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log(`[upload.js] Handling OPTIONS request from origin: ${requestOrigin}`);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log(`[upload.js] ❌ Method Not Allowed: ${req.method}`);
    return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });
  }

  // 假設 action 是固定的，或者從 payload 中獲取
  // 如果 action 也是動態的，需要從 req.body 中解構
  const defaultUploadAction = 'upload_photo'; // 或 'upload_signature'，取決於此文件的用途
  const { filename, base64, token, action = defaultUploadAction } = req.body; // 允許 action 從請求體傳入，否則用默認

  console.log(`[upload.js] Received POST request - action: ${action}, filename: ${filename ? 'present' : 'missing'}, token: ${token ? 'present' : 'missing'}`);

  if (!filename || !base64 || token !== 'anxi111003') {
    console.log('[upload.js] ❌ 缺少必要參數或 token 驗證失敗');
    return res.status(400).json({ status: 'error', message: '缺少必要參數或 token 驗證失敗' });
  }

  // 根據 action 決定 GAS 端要執行的動作
  let gasAction;
  if (action === 'upload_photo') {
    gasAction = 'upload_photo';
  } else if (action === 'upload_signature') {
    gasAction = 'upload_signature';
  } else {
    console.log(`[upload.js] ❌ 不支援的上傳 action: ${action}`);
    return res.status(400).json({ status: 'error', message: `不支援的上傳類型: ${action}` });
  }

  const bodyToGas = {
    action: gasAction,
    filename,
    base64
    // 如果 GAS 端 handleUploadPhoto/handleUploadSignature 需要 projectName (ssId)
    // const { projectName } = req.body;
    // projectName, // 則在這裡加入
  };

  try {
    console.log('[upload.js] ➡️  Forwarding to GAS with body:', JSON.stringify(bodyToGas).substring(0,100) + "..."); // 預覽部分 base64
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
      console.error(`[upload.js] ❌ GAS request failed with status ${gasRes.status}. Action: ${gasAction}. Response:`, rawText.substring(0, 500));
      return res.status(gasRes.status).json({
        status: 'error',
        message: `GAS 請求失敗 (action: ${gasAction})，狀態碼: ${gasRes.status}`,
        raw: rawText.substring(0, 500)
      });
    }

    console.log(`[upload.js] ✅ GAS response received (Action: ${gasAction}). Length: ${rawText.length}.`);

    try {
      const result = JSON.parse(rawText);
      console.log(`[upload.js] ✅ Successfully parsed JSON from GAS (Action: ${gasAction})`);
      return res.status(200).json(result);
    } catch (parseErr) {
      console.error(`[upload.js] ⚠️ JSON parsing error from GAS (Action: ${gasAction}). Error:`, parseErr.message);
      console.error('👉 Original GAS response text (first 1000 chars):', rawText.substring(0, 1000));
      return res.status(500).json({
        status: 'error',
        message: 'GAS 回傳的內容無法解析為 JSON，請檢查 Apps Script 的輸出。',
        action: gasAction,
        rawResponsePreview: rawText.substring(0, 500)
      });
    }

  } catch (err) {
    console.error(`[upload.js] ❌ Proxy internal error (Action: ${gasAction}). Error:`, err.message, err.stack);
    return res.status(500).json({ status: 'error', message: `代理伺服器內部錯誤: ${err.message}` });
  }
}
