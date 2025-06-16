// /api/image-proxy.js
import fetch from 'node-fetch';
import path from 'path'; // 引入 Node.js 的 path 模塊

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send('Image URL is required');
  }

  try {
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    // --- ✅ SVG 類型修正的核心邏輯 ---
    // 1. 從 URL 中獲取文件擴展名
    const fileExtension = path.extname(new URL(imageUrl).pathname).toLowerCase();

    let contentType = imageResponse.headers.get('content-type');

    // 2. 如果文件擴展名是 .svg，但 Google 返回的 Content-Type 不對
    if (fileExtension === '.svg' && !contentType.includes('svg')) {
      console.log(`Correcting Content-Type for SVG. Original: ${contentType}`);
      // 3. 強制將 Content-Type 修正為 'image/svg+xml'
      contentType = 'image/svg+xml';
    }
    // --- 修正結束 ---

    res.setHeader('Content-Type', contentType);
    imageResponse.body.pipe(res);

  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).send('Error fetching image');
  }
}
