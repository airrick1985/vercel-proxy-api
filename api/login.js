// api/login.js

export default async function handler(req, res) {
  console.log('--- NEW REQUEST ---');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('↩️ Preflight, returning 200');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.warn('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, password } = req.body;
  console.log('🔗 Forwarding to GAS with:', { name, password });

  const gasUrl = 'https://script.google.com/macros/s/AKfycbz5lJN8Ep66o7JktZf6FYXzLOPv9KP5-ihLbSRqoBqh4RmhebjmQ3QTiCcTthhXJwg2/exec';

  try {
    const gasResponse = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    console.log('🌐 GAS status:', gasResponse.status);

    const result = await gasResponse.json();
    console.log('📥 GAS result:', result);

    return res.status(200).json(result);
  } catch (err) {
    console.error('🔥 Proxy error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
