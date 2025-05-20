export default async function handler(req, res) {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbxWtv1K6UgvnktrNYFwzcOufggBq0urbht2V1hIVTLshIFF0Y8Fs-b9PblBAeXMRSPEYQ/exec'; // ✅ 替換成你的實際 GAS URL

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
    res.status(500).json({ success: false, error: { message: error.message } });
  }
}
