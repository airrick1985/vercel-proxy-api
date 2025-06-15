import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 設置 CORS 頭，允許所有來源訪問
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).send('Image URL is required');
  }

  try {
    // 伺服器端去 fetch 圖片
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    // 獲取圖片的 Content-Type
    const contentType = imageResponse.headers.get('content-type');
    res.setHeader('Content-Type', contentType);

    // 將圖片數據流式傳輸回客戶端
    imageResponse.body.pipe(res);

  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).send('Error fetching image');
  }
}
