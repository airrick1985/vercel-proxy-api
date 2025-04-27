import fetch from 'node-fetch';

const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec'; // <--- 你的GAS網址

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Only GET allowed' });
  }

  try {
    const response = await fetch(GAS_WEBAPP_URL);
    const data = await response.json();

    return res.status(200).json(data);

  } catch (e) {
    console.error('讀取戶別失敗:', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
