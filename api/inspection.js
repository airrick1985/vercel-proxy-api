import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });

const { action, token, ...payload } = req.body;



   //✅ 驗證 token（僅跳過 get_shared_inspection_records）
if (action !== 'get_shared_inspection_records' && token !== 'anxi111003') {
  return res.status(403).json({ status: 'error', message: 'Token 驗證失敗' });
}


  // ✅ 限定允許的 action 名稱
const allowActions = [
  'get_inspection_records',
  'add_inspection_record',
  'edit_inspection_record',
  'edit_inspection_record_with_photos',
  'update_inspection_record',
  'delete_inspection_record',
  'get_repair_status_options',
  'get_dropdown_options',
  'get_all_subcategories',
  'get_deleted_inspection_records',
  'restore_inspection_record',
  'delete_photo_from_record',
  'generate_share_url',
  'get_shared_inspection_records',
   'upload_signature',
  'confirm_inspection',
   'generate_inspection_pdf'
];


  if (!action || !allowActions.includes(action)) {
    return res.status(400).json({ status: 'error', message: '不支援的 action 參數' });
  }

  try {
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, token, ...payload })
    });

    const result = await gasRes.json();
    return res.status(200).json(result);
  } catch (err) {
    console.error('inspection.js 錯誤:', err);
    console.log('[proxy] action:', action);
    console.log('[proxy] token:', token);

    return res.status(500).json({ status: 'error', message: err.message });
  }
}
