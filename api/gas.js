export default async function handler(req, res) {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbxWtv1K6UgvnktrNYFwzcOufggBq0urbht2V1hIVTLshIFF0Y8Fs-b9PblBAeXMRSPEYQ/exec'; // ✅ 替換成你的實際 GAS URL

  // 加入 CORS 處理
  res.setHeader('Access-Control-Allow-Origin', '*'); // 或改成你的網站 domain
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 👉 處理 OPTIONS 預檢請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // 預檢請求直接結束
  }

  try {
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const result = await gasRes.json();
    res.status(gasRes.status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
}
