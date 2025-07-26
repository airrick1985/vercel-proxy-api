import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyOrkROg0DlK_eE17SZ0VerLmWAS_HA0AoOusqjcIVxtd4oKPqFfFjhna3x38AO7Gyn/exec';

export default async function handler(req, res) {
  res.setHeader('Access-control-Allow-Origin', '*');
  res.setHeader('Access-control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: '只允許 POST 方法' });

  const { action, token, ...payload } = req.body;

  // ✅ 核心修正 1：建立一個包含所有公開 action 的列表
  const publicActions = [
    'validate_id',
    'get_all_units_for_booking',
    'get_shared_inspection_records',
    'get_booking_initial_data',
    'get_units_by_building',
    'check_existing_booking',
    'get_booking_slots',
    'save_booking',
    'cancel_booking',
    'get_inspection_appointments' //將獲取行事曆資料的 action 設為公開

  ];

  // 如果 action 不在公開列表中，才需要檢查 token
  if (!publicActions.includes(action) && token !== 'anxi111003') {
    return res.status(403).json({ status: 'error', message: 'Token 驗證失敗' });
  }

  // ✅ 核心修正 2：建立一個包含所有合法 action 的總列表
  const allowActions = [
    // 所有公開的 action
    ...publicActions,
    
    // 所有需要 token 的內部 action
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
    'upload_signature',
    'confirm_inspection',
    'generate_inspection_pdf',
    'get_all_project_inspection_records'
  ];

  if (!action || !allowActions.includes(action)) {
    // 這個檢查現在可以正確識別 'get_booking_slots' 了
    return res.status(400).json({ status: 'error', message: '不支援的 action 參數' });
  }

  try {
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // ✅ 核心修正 3：確保無論公開或內部 action，都將 token 傳遞下去 (如果有的話)
      body: JSON.stringify({ action, token, ...payload })
    });

    const rawText = await gasRes.text();

    try {
      const result = JSON.parse(rawText);
      return res.status(200).json(result);
    } catch (parseErr) {
      console.error('⚠️ JSON 解析錯誤');
      console.error('👉 原始回應:', rawText);
      return res.status(500).json({
        status: 'error',
        message: 'GAS 回傳非 JSON，請檢查 Apps Script',
        raw: rawText
      });
    }

  } catch (err) {
    console.error('❌ proxy error:', err);
    console.log('[proxy] action:', action);
    console.log('[proxy] payload:', payload);

    return res.status(500).json({ status: 'error', message: err.message });
  }
}
