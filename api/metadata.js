import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });

  const { action, projectName, ...rest } = req.body;

  const allowActions = [
    'get_unit_list',
    'get_building_list',
    'get_house_detail',
    'get_all_house_details',
    'update_house_detail'
  ];

  if (!action || !allowActions.includes(action)) {
    return res.status(400).json({ status: 'error', message: '不支援的 action 參數' });
  }

  try {
    const bodyToSend = JSON.stringify({
      action,
      projectName,
      ...rest
    });

    console.log('[metadata.js] ✅ 發送到 GAS 的內容:', bodyToSend);

    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyToSend
    });

    const text = await gasRes.text();
    console.log('[metadata.js] ✅ GAS 回傳:', text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('[metadata.js] ❌ 回傳不是 JSON:', e.message);
      return res.status(500).json({ status: 'error', message: 'GAS 回傳非 JSON' });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[metadata.js] ❌ 錯誤:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
