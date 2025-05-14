// vercel-proxy-api/api/metadata.js
import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';
const PRODUCTION_ORIGIN = 'https://airrick1985.github.io';
const allowedOriginsForDev = [
  'https://glorious-barnacle-7rpgq4xjx4jfx79p-5173.app.github.dev',
  // 'http://localhost:5173' // 添加其他開發源
];

export default async function handler(req, res) {
  const requestOrigin = req.headers.origin;
  let effectiveAllowedOrigin;

  if (requestOrigin === PRODUCTION_ORIGIN) {
    effectiveAllowedOrigin = PRODUCTION_ORIGIN;
  } else if (process.env.NODE_ENV === 'development') {
    if (requestOrigin && allowedOriginsForDev.includes(requestOrigin)) {
      effectiveAllowedOrigin = requestOrigin;
    } else {
      effectiveAllowedOrigin = requestOrigin || '*';
      if (requestOrigin && !allowedOriginsForDev.includes(requestOrigin)) {
          console.warn(`[CORS - metadata.js] Development mode: Allowing unlisted origin ${requestOrigin}`);
      }
    }
  }

  if (effectiveAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', effectiveAllowedOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log(`[metadata.js] Handling OPTIONS request from origin: ${requestOrigin}`);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log(`[metadata.js] Method Not Allowed: ${req.method}`);
    return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });
  }

  const { action, projectName, token, ...rest } = req.body; // 假設可能也傳 token
  console.log(`[metadata.js] Received POST - action: ${action}, projectName: ${projectName}, token: ${token ? 'present' : 'missing'}`);

  // 如果 metadata 相關操作也需要 token 驗證，在此處添加
  // if (token !== 'anxi111003') {
  //   console.log('[metadata.js] Token 驗證失敗');
  //   return res.status(403).json({ status: 'error', message: 'Token 驗證失敗' });
  // }

  const allowActions = [
    'get_unit_list',
    'get_building_list',
    'get_house_detail',
    'get_all_house_details',
    'update_house_detail' // 假設有這個 action
  ];

  if (!action || !allowActions.includes(action)) {
    console.log(`[metadata.js] 不支援的 action 參數: ${action}`);
    return res.status(400).json({ status: 'error', message: `不支援的 action 參數: ${action}` });
  }

  // 檢查對於這些 action，projectName 是否存在
  if (!projectName && ['get_unit_list', 'get_building_list', 'get_house_detail', 'get_all_house_details', 'update_house_detail'].includes(action) ) {
    console.log(`[metadata.js] Action ${action} 需要 projectName，但未提供。`);
    return res.status(400).json({ status: 'error', message: `Action ${action} 需要 projectName 參數。` });
  }

  const bodyToGas = {
    action,
    projectName,
    token, // 如果 GAS 端需要，則轉發
    ...rest
  };

  try {
    console.log('[metadata.js] Forwarding to GAS with body:', JSON.stringify(bodyToGas));
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
      console.error(`[metadata.js] GAS request failed with status ${gasRes.status}. Action: ${action}. Response:`, rawText.substring(0, 500));
      return res.status(gasRes.status).json({
        status: 'error',
        message: `GAS 請求失敗 (action: ${action})，狀態碼: ${gasRes.status}`,
        raw: rawText.substring(0, 500)
      });
    }

    console.log(`[metadata.js] GAS response received (Action: ${action}). Length: ${rawText.length}. Preview:`, rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''));

    try {
      const result = JSON.parse(rawText);
      console.log(`[metadata.js] Successfully parsed JSON from GAS (Action: ${action})`);
      return res.status(200).json(result);
    } catch (parseErr) {
      console.error(`[metadata.js] JSON parsing error from GAS (Action: ${action}). Error:`, parseErr.message);
      console.error('Original GAS response text (first 1000 chars):', rawText.substring(0, 1000));
      return res.status(500).json({
        status: 'error',
        message: 'GAS 回傳的內容無法解析為 JSON，請檢查 Apps Script 的輸出。',
        action: action,
        rawResponsePreview: rawText.substring(0, 500)
      });
    }

  } catch (err) {
    console.error(`[metadata.js] Proxy internal error (Action: ${action}). Error:`, err.message, err.stack);
    return res.status(500).json({ status: 'error', message: `代理伺服器內部錯誤: ${err.message}` });
  }
}
