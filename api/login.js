import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');  // ✅ 加這個
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // ✅ 加這個
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');  // ✅ 加這個

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // ✅ 預檢請求直接快速回應
  }

  if (req.method !== 'POST') {
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
      redirect: 'follow',
      body: JSON.stringify({ action: 'login', key, password })
    });

    const text = await gasRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('回傳不是有效 JSON:', text);
      return res.status(500).json({ status: 'error', message: 'GAS回傳無效JSON' });
    }

    return res.status(200).json(data);

  } catch (e) {
    console.error('Proxy login error:', e);
    return res.status(500).json({ status: 'error', message: 'Proxy伺服器錯誤' });
  }
}
