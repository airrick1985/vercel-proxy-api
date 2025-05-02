// /api/add-inspection-record.js
import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxpEwvLYOpeDHdzT0t1Y-Ybhn3rzwJ4wH65GNWax9j7VdAft7zsM2wmpGCSfEXIkDq1MA/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });

  const { token, ...record } = req.body;
  if (token !== 'anxi111003') {
    return res.status(403).json({ status: 'error', message: 'token 驗證失敗' });
  }

  try {
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_inspection_record',
        ...record
      })
    });

    const result = await gasRes.json();
    return res.status(200).json(result);

  } catch (e) {
    console.error('add-inspection-record proxy error:', e);
    return res.status(500).json({ status: 'error', message: '伺服器錯誤' });
  }
}
