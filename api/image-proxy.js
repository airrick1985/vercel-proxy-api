import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || !url.startsWith('https://drive.google.com/')) {
    return res.status(400).send('Invalid Google Drive URL');
  }

  try {
    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      throw new Error(`Failed to fetch image: ${imageRes.statusText}`);
    }

    // 將 Google 返回的圖片響應頭複製到我們自己的響應中
    res.setHeader('Content-Type', imageRes.headers.get('content-type'));
    res.setHeader('Content-Length', imageRes.headers.get('content-length'));
    
    // 將圖片數據流直接 pipe 到響應中
    imageRes.body.pipe(res);

  } catch (error) {
    res.status(500).send(`Error fetching image: ${error.message}`);
  }
}
