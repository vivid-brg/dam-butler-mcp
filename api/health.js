export default function handler(req, res) {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
    oauth_status: process.env.BRANDFOLDER_CLIENT_ID ? 'configured' : 'pending',
    endpoints: {
      mcp: `https://${req.headers.host}/api/mcp`,
      health: `https://${req.headers.host}/api/health`
    }
  });
}
