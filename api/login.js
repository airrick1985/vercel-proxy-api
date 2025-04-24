// api/login.js (Vercel Serverless Function)

export default async function handler(req, res) {
  // 1. 永遠回應 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. 如果是 preflight OPTIONS 請求，直接回 200 結束
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 只處理 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, password } = req.body;
  const gasUrl = 'https://script.google.com/macros/s/AKfycbz5lJN8Ep66o7JktZf6FYXzLOPv9KP5-ihLbSRqoBqh4RmhebjmQ3QTiCcTthhXJwg2/exec'; // 換成你的 ID

  try {
    // 4. 轉發到 Google Apps Script
    const gasResponse = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    const result = await gasResponse.json();

    // 5. 回傳 GAS 的結果
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
