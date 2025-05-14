// vercel-proxy-api/api/inspection.js
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
          console.warn(`[CORS - inspection.js] Development mode: Allowing unlisted origin ${requestOrigin}`);
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
    console.log(`[inspection.js] Handling OPTIONS request from origin: ${requestOrigin}`);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log(`[inspection.js] Method Not Allowed: ${req.method}`);
    return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });
  }

  const { action, token, projectName, ...payload } = req.body;
  console.log(`[inspection.js] Received POST - action: ${action}, projectName: ${projectName}, token: ${token ? 'present' : 'missing'}`);

  if (action !== 'get_shared_inspection_records' && token !== 'anxi111003') {
    console.log('[inspection.js] Token 驗證失敗');
    return res.status(403).json({ status: 'error', message: 'Token 驗證失敗' });
  }

  const allowActions = [
    'get_inspection_records',
    'add_inspection_record',
    'edit_inspection_record',
    'edit_inspection_record_with_photos',
    'update_inspection_record',
    'delete_inspection_record',
    // 'get_repair_status_options', // 這些通常在 dropdown.js 中處理
    // 'get_dropdown_options',
    // 'get_all_subcategories',
    'get_deleted_inspection_records',
    'restore_inspection_record',
    'delete_photo_from_record',
    'generate_share_url',
    'get_shared_inspection_records',
    // 'upload_signature', // upload_signature 通常在 upload.js 中處理
    'confirm_inspection',
    'generate_inspection_pdf',
    'get_all_project_inspection_records'
  ];

  if (!action || !allowActions.includes(action)) {
    console.log(`[inspection.js] 不支援的 action 參數: ${action}`);
    return res.status(400).json({ status: 'error', message: `不支援的 action 參數: ${action}` });
  }

  // 檢查對於需要 projectName 的 action，projectName 是否存在
  const actionsRequiringProjectName = [ // 這些 action 在 GAS 端需要 ssId，因此代理層必須轉發 projectName
    'get_inspection_records',
    'add_inspection_record',
    'edit_inspection_record',
    'edit_inspection_record_with_photos',
    'update_inspection_record',
    'delete_inspection_record',
    'get_deleted_inspection_records',
    'restore_inspection_record',
    'delete_photo_from_record',
    'generate_share_url',
    // 'get_shared_inspection_records', // 這個 action 可能有自己的 token 和 unitId 邏輯，不一定依賴 projectName 獲取 ssId
    'confirm_inspection',
    'generate_inspection_pdf',
    'get_all_project_inspection_records'
  ];

  if (actionsRequiringProjectName.includes(action) && !projectName) {
    console.log(`[inspection.js] Action ${action} 需要 projectName，但未提供。`);
    return res.status(400).json({ status: 'error', message: `Action ${action} 需要 projectName 參數。` });
  }


  const bodyToGas = {
    action,
    token, // 即使代理層驗證了，GAS 端可能也需要（例如 get_shared_inspection_records）
    projectName, // 確保 projectName 被轉發
    ...payload
  };

  try {
    console.log('[inspection.js] Forwarding to GAS with body:', JSON.stringify(bodyToGas));
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
      console.error(`[inspection.js] GAS request failed with status ${gasRes.status}. Action: ${action}. Response:`, rawText.substring(0, 500));
      return res.status(gasRes.status).json({
        status: 'error',
        message: `GAS 請求失敗 (action: ${action})，狀態碼: ${gasRes.status}`,
        raw: rawText.substring(0, 500)
      });
    }

    console.log(`[inspection.js] GAS response received (Action: ${action}). Length: ${rawText.length}. Preview:`, rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''));

    try {
      const result = JSON.parse(rawText);
      console.log(`[inspection.js] Successfully parsed JSON from GAS (Action: ${action})`);
      return res.status(200).json(result);
    } catch (parseErr) {
      console.error(`[inspection.js] JSON parsing error from GAS (Action: ${action}). Error:`, parseErr.message);
      console.error('Original GAS response text (first 1000 chars):', rawText.substring(0, 1000));
      return res.status(500).json({
        status: 'error',
        message: 'GAS 回傳的內容無法解析為 JSON，請檢查 Apps Script 的輸出。',
        action: action,
        rawResponsePreview: rawText.substring(0, 500)
      });
    }

  } catch (err) {
    console.error(`[inspection.js] Proxy internal error (Action: ${action}). Error:`, err.message, err.stack);
    return res.status(500).json({ status: 'error', message: `代理伺服器內部錯誤: ${err.message}` });
  }
}
