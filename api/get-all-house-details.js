import fetch from 'node-fetch';

// ✅ 替換為你的 GAS Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxpEwvLYOpeDHdzT0t1Y-Ybhn3rzwJ4wH65GNWax9j7VdAft7zsM2wmpGCSfEXIkDq1MA/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });
  }

  const { token } = req.body;

  if (!token || token !== 'anxi111003') {
    return res.status(403).json({ status: 'error', message: 'Token 驗證失敗' });
  }

  try {
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_all_house_details' })
    });

    const text = await gasRes.text();
    console.log('GAS get_all_house_details 回傳:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('GAS回傳不是有效JSON:', text);
      return res.status(500).json({ status: 'error', message: 'GAS回傳無效JSON' });
    }

    return res.status(200).json(data);

  } catch (e) {
    console.error('Proxy get-all-house-details error:', e);
    return res.status(500).json({ status: 'error', message: 'Proxy伺服器錯誤' });
  }
}
