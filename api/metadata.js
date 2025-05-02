import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxpEwvLYOpeDHdzT0t1Y-Ybhn3rzwJ4wH65GNWax9j7VdAft7zsM2wmpGCSfEXIkDq1MA/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });

  const { action, token, ...payload } = req.body;
  const allowActions = [
    'get_unit_list',
    'get_building_list',
    'get_house_detail',
    'get_all_house_details'
  ];

  if (!action || !allowActions.includes(action)) {
    return res.status(400).json({ status: 'error', message: '不支援的 action 參數' });
  }

  if (token !== 'anxi111003') {
    return res.status(403).json({ status: 'error', message: 'Token 驗證失敗' });
  }

  try {
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });

    const result = await gasRes.json();
    return res.status(200).json(result);
  } catch (err) {
    console.error('metadata.js 錯誤:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
