// api/login.js
import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: 'error', message: 'Only POST allowed' });
  }

  const { key, password } = req.body;
  if (!key || !password) {
    return res.status(400).json({ status: 'error', message: '缺少 key 或 password' });
  }

  try {
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',   // !!! 重點：一定要加 action: 'login'
        key,
        password
      })
    });

    const data = await gasRes.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (e) {
    console.error('Proxy login error:', e);
    return res.status(500).json({ status: 'error', message: 'Proxy 伺服器錯誤' });
  }
}
