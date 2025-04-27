import fetch from 'node-fetch';

const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec'; // <--- 你的GAS網址

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Only POST allowed' });
  }

  try {
    const response = await fetch(GAS_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_unit_list' }) // ⚡⚡ 加上 action: 'get_unit_list'
    });

    const text = await response.text();
    console.log('GAS 回傳內容:', text);

    const data = JSON.parse(text);

    return res.status(200).json(data);

  } catch (e) {
    console.error('fetch get_unit_list error:', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}