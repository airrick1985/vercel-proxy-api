// /api/sales.js

import fetch from 'node-fetch';

// 你的 Google Apps Script Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';

export default async function handler(req, res) {
  // --- CORS 響應頭設置 ---
  // 無論什麼請求，都先設置這些頭，確保瀏覽器能收到
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // 或者更安全地設置為你的前端域名
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // --- 處理 OPTIONS 預檢請求 ---
  if (req.method === 'OPTIONS') {
    // 預檢請求只需要返回 200 OK 和 CORS 頭即可，不需要其他內容
    res.status(200).end();
    return;
  }

  // --- 驗證請求方法 ---
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  // --- 處理 POST 請求的核心邏輯 ---
  try {
    const { action, ...payload } = req.body;

    // Action 白名單，增加安全性
    const allowActions = ['get_sales_control_data',
                          'get_parking_list',
                          'generate_quote_pdf',
                          'update_sales_data',
                          'get_sales_options',
                          'generate_payment_schedule',
                          'send_payment_schedule_email',
                          'get_svg_from_folder',
                          'update_parking_slide',
                          'cancel_purchase',
                          'get_parking_lot_details',
                          'update_parking_lot_details'
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

    // 檢查 GAS 的響應狀態
    if (!gasRes.ok) {
      // 如果 GAS 返回錯誤，嘗試讀取文本並記錄
      const errorText = await gasRes.text();
      console.error(`[sales.js] GAS returned an error: ${gasRes.status}`, errorText);
      // 返回一個更清晰的錯誤給前端
      return res.status(502).json({ status: 'error', message: 'Upstream service (GAS) returned an error.', details: errorText.substring(0, 500) });
    }

    // 嘗試將 GAS 的響應解析為 JSON
    const result = await gasRes.json();
    return res.status(200).json(result);

  } catch (e) {
    // 捕獲所有其他錯誤（網絡問題、JSON解析失敗等）
    console.error('[sales.js] An error occurred in the proxy function:', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
