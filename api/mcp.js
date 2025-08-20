export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({
      name: "dam-butler-mcp",
      version: "1.0.0",
      description: "Breville DAM Butler - Intent-based brand asset search",
      status: "ready",
      oauth_configured: !!process.env.BRANDFOLDER_CLIENT_ID,
      capabilities: {
        tools: [
          {
            name: "find_brand_assets",
            description: "Find brand assets using natural language",
            schema: {
              type: "object",
              properties: {
                request: { type: "string" }
              }
            }
          }
        ]
      }
    });
  }

  if (req.method === 'POST') {
    const { tool, arguments: args } = req.body || {};
    
    if (tool === 'find_brand_assets') {
      return res.json({
        success: true,
        message: "DAM Butler is ready! Waiting for Brandfolder OAuth setup.",
        request: args?.request,
        status: "oauth_pending"
      });
    }
    
    return res.status(400).json({ error: 'Unknown tool' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
