export default function handler(req, res) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>🎯 DAM Butler MCP Server</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 600px; margin: 50px auto; padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; text-align: center; min-height: 80vh;
    }
    .container { 
      background: rgba(255,255,255,0.1); border-radius: 20px; 
      padding: 40px; backdrop-filter: blur(10px);
    }
    .title { font-size: 2.5em; margin-bottom: 20px; }
    .status { font-size: 1.2em; margin: 20px 0; }
    .endpoint { 
      background: rgba(0,0,0,0.3); padding: 10px; 
      border-radius: 8px; font-family: monospace; margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">🎯 DAM Butler MCP</div>
    <div class="status">✅ Server is running!</div>
    
    <h3>📍 Endpoints:</h3>
    <div class="endpoint">MCP: ${req.headers.host}/api/mcp</div>
    <div class="endpoint">Health: ${req.headers.host}/api/health</div>
    
    <h3>🔐 Status:</h3>
    <p>⏳ Waiting for Brandfolder OAuth credentials</p>
    <p>Ready for ChatGPT Enterprise integration!</p>
  </div>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}
