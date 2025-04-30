export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  try {
    const response = await fetch(process.env.GAS_DEPLOY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_all_house_details'
      })
    });

    const result = await response.json();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching get_all_house_details:', error);
    res.status(500).json({ status: 'error', message: '伺服器錯誤：' + error.message });
  }
}
