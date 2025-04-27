import fetch from 'node-fetch';

const SHEET_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets/1j__Y6H7xtBbkSr7Gwr2On3qUi53Cwov4dyh8wbryhus/values/戶別選單!A1:T'; 
// ⚡ 注意：這裡直接從 Google Sheets API讀！要確保有API KEY或設定好分享權限

const API_KEY = '你的Google API Key'; // ⚡需要一個Google API KEY (或用 Apps Script中轉也可)

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
    const sheetUrl = `${SHEET_API_URL}?key=${API_KEY}`;
    const response = await fetch(sheetUrl);
    const data = await response.json();

    if (!data.values || data.values.length === 0) {
      return res.status(500).json({ status: 'error', message: '讀取戶別資料失敗' });
    }

    const headers = data.values[0];
    const rows = data.values.slice(1);

    // 整理成 { 棟別: [戶別, 戶別...] }
    const units = {};

    headers.forEach((building, colIndex) => {
      if (!building) return;
      units[building] = [];
      rows.forEach(row => {
        if (row[colIndex]) {
          units[building].push(row[colIndex]);
        }
      });
    });

    return res.status(200).json({ status: 'success', units });

  } catch (e) {
    console.error('讀取戶別失敗:', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
