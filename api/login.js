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
      redirect: 'follow', // ✅ 加上這個，正確跟隨 Google 的 redirect
      body: JSON.stringify({
        action: 'login',
        key,
        password
      })
    });

    const text = await gasRes.text(); // ✅ 先用 text 讀進來
    console.log('GAS 回傳文字:', text);

    let data;
    try {
      data = JSON.parse(text); // ✅ 再手動轉成 JSON
    } catch (e) {
      console.error('回傳不是有效 JSON:', text);
      return res.status(500).json({ status: 'error', message: 'GAS 回傳無效 JSON' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);

  } catch (e) {
    console.error('Proxy login error:', e);
    return res.status(500).json({ status: 'error', message: 'Proxy 伺服器錯誤' });
  }
}
