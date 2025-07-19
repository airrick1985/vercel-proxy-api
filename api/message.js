import fetch from 'node-fetch';

// 你的 Google Apps Script Web App URL (維持不變)
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

    // ✅【核心修改】Action 白名單，只包含訊息系統相關的 action
    const allowActions = [
      'get_message_permission_options',
      'get_recipient_list',
      'upload_attachment', // 注意：附件上傳可能需要特殊處理，我們先放進來
      'send_message',
      'get_my_messages',
      'get_message_detail',
      'get_unread_message_count',
      'set_message_status'
    ];

    if (!action || !allowActions.includes(action)) {
      return res.status(400).json({ status: 'error', message: `Action "${action}" is not supported by this endpoint.` });
    }
    
    // 🔴【注意】附件上傳的特殊處理
    // Vercel Serverless Functions 對請求體大小有限制 (通常是 4.5MB)。
    // 如果您的附件很大，直接透過 Vercel 代理傳遞 base64 可能會失敗。
    // 一個解決方案是讓前端的附件上傳 API (uploadAttachment) 直接呼叫 GAS URL，
    // 而其他 metadata 請求則通過 Vercel 代理。
    // 但我們先用目前架構實作，如果遇到問題再來優化。

    // 向 GAS 發送請求 (與 sales.js 邏輯相同)
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });

    if (!gasRes.ok) {
      const errorText = await gasRes.text();
      console.error(`[message.js] GAS returned an error: ${gasRes.status}`, errorText);
      return res.status(502).json({ status: 'error', message: 'Upstream service (GAS) returned an error.', details: errorText.substring(0, 500) });
    }

    const result = await gasRes.json();
    return res.status(200).json(result);

  } catch (e) {
    console.error('[message.js] An error occurred in the proxy function:', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
