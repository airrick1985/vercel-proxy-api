// vercel-proxy-api/api/dropdown.js
import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';

export default async function handler(req, res) {

  const allowedOrigin = process.env.NODE_ENV === 'development' ? '*' : 'https://airrick1985.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); 

  if (req.method === 'OPTIONS') {
    console.log('[dropdown.js] Handling OPTIONS request');
    return res.status(200).end();
  }


  if (req.method !== 'POST') {
    console.log(`[dropdown.js] ❌ Method Not Allowed: ${req.method}`);
    return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });
  }

 
  const { action, token, projectName, ...payload } = req.body;
  console.log(`[dropdown.js] Received POST request - action: ${action}, projectName: ${projectName}, token: ${token ? 'present' : 'missing'}`);


  if (token !== 'anxi111003') {
    console.log('[dropdown.js] ❌ Token 驗證失敗');
    return res.status(403).json({ status: 'error', message: 'Token 驗證失敗' });
  }


  const allowedActions = ['get_dropdown_options', 'get_all_subcategories', 'get_repair_status_options'];
  if (!action || !allowedActions.includes(action)) {
    console.log(`[dropdown.js] ❌ 不支援的 action 參數: ${action}`);
    return res.status(400).json({ status: 'error', message: '不支援的 action 參數' });
  }


  const bodyToGas = {
    action,
    projectName, 
    token,      
    ...payload
  };

  try {
    console.log('[dropdown.js] ➡️  Forwarding to GAS with body:', JSON.stringify(bodyToGas));
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
      console.error(`[dropdown.js] ❌ GAS request failed with status ${gasRes.status}. Action: ${action}. Response:`, rawText.substring(0, 500));
  
      return res.status(gasRes.status).json({
        status: 'error',
        message: `GAS 請求失敗 (action: ${action})，狀態碼: ${gasRes.status}`,
        raw: rawText.substring(0, 500)
      });
    }

    console.log(`[dropdown.js] ✅ GAS response received (Action: ${action}). Length: ${rawText.length}. Preview:`, rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''));

    try {
      const result = JSON.parse(rawText);
      console.log(`[dropdown.js] ✅ Successfully parsed JSON from GAS (Action: ${action})`);
      return res.status(200).json(result);
    } catch (parseErr) {
      console.error(`[dropdown.js] ⚠️ JSON parsing error from GAS (Action: ${action}). Error:`, parseErr.message);
      console.error('👉 Original GAS response text:', rawText.substring(0, 1000)); 
   
      return res.status(500).json({
        status: 'error',
        message: 'GAS 回傳的內容無法解析為 JSON，請檢查 Apps Script 的輸出。',
        action: action,
        rawResponsePreview: rawText.substring(0, 500) 
      });
    }

  } catch (err) {
    console.error(`[dropdown.js] ❌ Proxy internal error (Action: ${action}). Error:`, err.message, err.stack);

    return res.status(500).json({ status: 'error', message: `代理伺服器內部錯誤: ${err.message}` });
  }
}
