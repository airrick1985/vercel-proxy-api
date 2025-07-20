import fetch from 'node-fetch';

// 您的 Google Apps Script Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';

export default async function handler(req, res) {
  // --- CORS 響應頭設置 ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // --- 處理 OPTIONS 預檢請求 ---
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  try {
    const { action, ...payload } = req.body;

    // ✅【核心修改】Action 白名單，只包含訂閱管理相關的 action
    const allowActions = [
      'get_all_subscriptions',
      'add_subscription',
      'update_subscription',
      'delete_subscription',
      'get_master_data_for_subscription_form'
    ];

    if (!action || !allowActions.includes(action)) {
      return res.status(400).json({ status: 'error', message: `Action "${action}" is not supported by this endpoint.` });
    }

    // 向 GAS 發送請求
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });

    if (!gasRes.ok) {
      const errorText = await gasRes.text();
      console.error(`[subscriptionManagement.js] GAS returned an error: ${gasRes.status}`, errorText);
      return res.status(502).json({ status: 'error', message: 'Upstream service (GAS) returned an error.', details: errorText.substring(0, 500) });
    }

    const result = await gasRes.json();
    return res.status(200).json(result);

  } catch (e) {
    console.error('[subscriptionManagement.js] An error occurred in the proxy function:', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
