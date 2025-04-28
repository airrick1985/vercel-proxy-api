export default async function handler(req, res) {
  // --- 設定 CORS Header ---
  res.setHeader('Access-Control-Allow-Origin', '*'); // 允許任何來源跨域
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // 允許 POST 與 OPTIONS
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // 允許 Content-Type Header

  // --- 處理預檢請求（CORS OPTIONS）---
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- 僅允許 POST ---
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  // --- 解析 Body ---
  const { unit, token } = req.body;

  if (!unit || !token) {
    return res.status(400).json({ status: 'error', message: '缺少必要參數 (unit 或 token)' });
  }

  const gasUrl = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec'; // ✅ 換成你的 GAS API URL

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit, token })
    });

    const text = await response.text();
    console.log('GAS 回傳內容：', text);

    const json = JSON.parse(text);
    return res.status(200).json(json);

  } catch (error) {
    console.error('Proxy 錯誤:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
