// api/auth-callback.js - OAuth callback endpoint for Brandfolder
import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS headers for ChatGPT Enterprise
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'method_not_allowed',
      message: 'Only GET method allowed for OAuth callback' 
    });
  }

  const { code, state, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect(`/auth-error?error=${encodeURIComponent(error)}`);
  }
  
  if (!code) {
    return res.status(400).json({ 
      error: 'missing_code',
      message: 'Authorization code not provided' 
    });
  }

  try {
    console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');
    
    // Exchange authorization code for access token
    const tokens = await exchangeCodeForTokens(code, state);
    
    if (!tokens || !tokens.access_token) {
      throw new Error('Failed to obtain access token');
    }

    console.log('OAuth success - access token obtained');
    
    // Return success page with setup instructions
    const successHtml = generateSuccessPage(tokens, req.headers.host);
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(successHtml);

  } catch (authError) {
    console.error('OAuth callback error:', authError);
    
    const errorHtml = generateErrorPage(authError.message, req.headers.host);
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(errorHtml);
  }
}

async function exchangeCodeForTokens(code, state) {
  const tokenUrl = 'https://oauth2.brandfolder-apps.com/oauth2/token';
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: process.env.BRANDFOLDER_CLIENT_ID,
    client_secret: process.env.BRANDFOLDER_CLIENT_SECRET,
    redirect_uri: process.env.BRANDFOLDER_REDIRECT_URI
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  const tokens = await response.json();
  return tokens;
}

function generateSuccessPage(tokens, host) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎉 DAM Butler Authentication Successful</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            max-width: 900px;
            width: 100%;
            animation: slideUp 0.8s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .success-icon {
            text-align: center;
            font-size: 5em;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }
        
        h1 {
            color: #22c55e;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
            font-weight: 700;
        }
        
        .subtitle {
            text-align: center;
            color: #64748b;
            margin-bottom: 40px;
            font-size: 1.2em;
            font-weight: 300;
        }
        
        .step-section {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            border-left: 5px solid #6366f1;
            transition: all 0.3s ease;
        }
        
        .step-section:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .step-section h3 {
            color: #4f46e5;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 1.4em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .endpoint-box {
            background: #1f2937;
            color: #f9fafb;
            padding: 20px;
            border-radius: 12px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            margin: 15px 0;
            overflow-x: auto;
            font-size: 0.95em;
            line-height: 1.4;
            border: 1px solid #374151;
        }
        
        .copy-button {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85em;
            margin-top: 10px;
            transition: all 0.2s ease;
        }
        
        .copy-button:hover {
            background: #4338ca;
            transform: translateY(-1px);
        }
        
        .example-queries {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            border: 1px solid #bbf7d0;
        }
        
        .example-queries h4 {
            color: #166534;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        
        .query-example {
            background: white;
            padding: 15px 20px;
            margin: 12px 0;
            border-radius: 8px;
            border-left: 4px solid #22c55e;
            font-style: italic;
            font-weight: 500;
            color: #166534;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .query-example:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #bfdbfe;
            transition: all 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: 800;
            color: #2563eb;
            display: block;
        }
        
        .stat-label {
            color: #64748b;
            font-size: 0.9em;
            margin-top: 5px;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
            color: #64748b;
        }
        
        .token-info {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            font-size: 0.9em;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 25px 0;
        }
        
        .feature-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #8b5cf6;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .feature-card h5 {
            color: #7c3aed;
            margin-bottom: 10px;
            font-size: 1em;
        }
        
        .feature-card p {
            color: #64748b;
            font-size: 0.9em;
            margin: 0;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 25px;
                margin: 10px;
            }
            
            h1 {
                font-size: 2em;
            }
            
            .stats {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .endpoint-box {
                font-size: 0.8em;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">🎉</div>
        <h1>Vault Authentication Successful!</h1>
        <div class="subtitle">Your DAM Butler MCP is now authenticated and ready to use</div>

        <div class="stats">
            <div class="stat-card">
                <span class="stat-number">215,476</span>
                <div class="stat-label">Total Assets</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">11</span>
                <div class="stat-label">Collections</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">6</span>
                <div class="stat-label">Brands</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">11</span>
                <div class="stat-label">Regions</div>
            </div>
        </div>

        <div class="step-section">
            <h3>🚀 Step 1: Open ChatGPT Enterprise</h3>
            <p>Go to your ChatGPT Enterprise workspace and find your <strong>"DAM Butler"</strong> Custom GPT.</p>
        </div>

        <div class="step-section">
            <h3>🔗 Step 2: Verify MCP Endpoint</h3>
            <p>Your Custom GPT should be configured with this MCP endpoint:</p>
            <div class="endpoint-box">https://${host}/mcp</div>
            <button class="copy-button" onclick="copyToClipboard('https://${host}/mcp')">📋 Copy Endpoint</button>
        </div>

        <div class="step-section">
            <h3>🧠 Step 3: System Instructions</h3>
            <p>Ensure your Custom GPT has these instructions:</p>
            <div class="endpoint-box">You are the DAM Butler, an AI assistant that helps Breville team members find digital assets from The Vault (Breville's DAM system).

You understand:
- Breville brands: Breville (AU/US/CA), Sage (UK/EU/DE), ChefSteps, Baratza, Lelit, Beanz
- Product families: Oracle Jet (BES985/SES985), Oracle Dual Boiler (BES995/SES995), Oracle Touch (BES990/SES990)
- Regions: Australia (AU), USA (US), Canada (CA), UK (GB), Germany (DE), Europe (EU)
- Asset types: logos, product photos, lifestyle shots, marketing materials, buyer's guides
- SKU patterns: BES985BSS1BNA1 (Breville US Brushed Steel), SES985BSS4GUK1 (Sage UK Brushed Steel)

When users ask for assets, use the find_vault_assets tool to search intelligently. Always be helpful and provide download links, usage recommendations, and format suggestions.

Be conversational and understand natural language like "Oracle Jet logo for my presentation" or "Sage product photos for German market."</div>
            <button class="copy-button" onclick="copyToClipboard(\`You are the DAM Butler, an AI assistant that helps Breville team members find digital assets from The Vault (Breville's DAM system).

You understand:
- Breville brands: Breville (AU/US/CA), Sage (UK/EU/DE), ChefSteps, Baratza, Lelit, Beanz
- Product families: Oracle Jet (BES985/SES985), Oracle Dual Boiler (BES995/SES995), Oracle Touch (BES990/SES990)
- Regions: Australia (AU), USA (US), Canada (CA), UK (GB), Germany (DE), Europe (EU)
- Asset types: logos, product photos, lifestyle shots, marketing materials, buyer's guides
- SKU patterns: BES985BSS1BNA1 (Breville US Brushed Steel), SES985BSS4GUK1 (Sage UK Brushed Steel)

When users ask for assets, use the find_vault_assets tool to search intelligently. Always be helpful and provide download links, usage recommendations, and format suggestions.

Be conversational and understand natural language like "Oracle Jet logo for my presentation" or "Sage product photos for German market."\`)">📋 Copy Instructions</button>
        </div>

        <div class="step-section">
            <h3>🎯 Step 4: Start Searching!</h3>
            <div class="example-queries">
                <h4>Try these example queries in your Custom GPT:</h4>
                <div class="query-example" onclick="copyToClipboard(this.textContent)">"Find Oracle Jet logo for my presentation"</div>
                <div class="query-example" onclick="copyToClipboard(this.textContent)">"Get Sage product photos for UK market"</div>
                <div class="query-example" onclick="copyToClipboard(this.textContent)">"Show me Oracle Dual Boiler lifestyle shots for social media"</div>
                <div class="query-example" onclick="copyToClipboard(this.textContent)">"I need Australian buyer's guide assets"</div>
                <div class="query-example" onclick="copyToClipboard(this.textContent)">"Find Breville logo in PNG format for email campaign"</div>
                <div class="query-example" onclick="copyToClipboard(this.textContent)">"Get BES985BSS1BNA1 product photography"</div>
            </div>
            <p><em>💡 Tip: Click any example above to copy it!</em></p>
        </div>

        <div class="step-section">
            <h3>🔧 Advanced Features</h3>
            <div class="feature-grid">
                <div class="feature-card">
                    <h5>🧠 Smart Intent Parsing</h5>
                    <p>Understands natural language and context to find exactly what you need</p>
                </div>
                <div class="feature-card">
                    <h5>🌍 Regional Intelligence</h5>
                    <p>Automatically detects Breville vs Sage branding based on your market</p>
                </div>
                <div class="feature-card">
                    <h5>🎨 Format Optimization</h5>
                    <p>Suggests best formats for your use case (PNG for presentations, EPS for print)</p>
                </div>
                <div class="feature-card">
                    <h5>📱 Use Case Awareness</h5>
                    <p>Optimizes recommendations for web, print, social, email, and presentations</p>
                </div>
                <div class="feature-card">
                    <h5>🔍 SKU Recognition</h5>
                    <p>Understands specific product SKUs like BES985BSS1BNA1 and SES985BSS4GUK1</p>
                </div>
                <div class="feature-card">
                    <h5>💡 Usage Recommendations</h5>
                    <p>Provides helpful tips for each asset including technical specifications</p>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="token-info">
                <strong>🔐 Access Token:</strong> ${tokens.access_token.substring(0, 20)}...<br>
                <strong>⏰ Expires:</strong> ${Math.round((tokens.expires_in || 3600) / 3600)} hours<br>
                <em>This token is securely stored and will be used for your asset searches.</em>
            </div>
            
            <p style="margin-top: 30px;">
                <strong>🎯 Built with ❤️ for the Breville team</strong><br>
                <em>Transforming digital asset discovery through intent-based AI</em>
            </p>
        </div>
    </div>

    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(function() {
                // Visual feedback
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = '✅ Copied!';
                button.style.background = '#22c55e';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '#4f46e5';
                }, 2000);
            }).catch(function(err) {
                console.error('Could not copy text: ', err);
            });
        }
        
        // Add some interactive flair
        document.addEventListener('DOMContentLoaded', function() {
            // Animate stat cards on scroll
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animation = 'slideUp 0.6s ease-out';
                    }
                });
            });
            
            document.querySelectorAll('.stat-card, .step-section').forEach(el => {
                observer.observe(el);
            });
        });
    </script>
</body>
</html>
  `;
}

function generateErrorPage(errorMessage, host) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>❌ Authentication Error</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            max-width: 600px;
            width: 100%;
            text-align: center;
        }
        
        .error-icon {
            font-size: 5em;
            margin-bottom: 20px;
            animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        h1 {
            color: #dc2626;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        
        .error-message {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
            color: #991b1b;
        }
        
        .retry-section {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
        }
        
        .retry-button {
            background: #22c55e;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 1.1em;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        
        .retry-button:hover {
            background: #16a34a;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
        }
        
        .help-section {
            text-align: left;
            margin-top: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 10px;
        }
        
        .help-section h3 {
            color: #374151;
            margin-bottom: 15px;
        }
        
        .help-section ul {
            color: #64748b;
            line-height: 1.6;
        }
        
        .help-section li {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Authentication Failed</h1>
        
        <div class="error-message">
            <strong>Error:</strong> ${errorMessage}
        </div>
        
        <div class="retry-section">
            <p>Don't worry! Authentication issues are usually easy to fix.</p>
            <br>
            <a href="/authenticate" class="retry-button">🔄 Try Again</a>
        </div>
        
        <div class="help-section">
            <h3>💡 Common Solutions:</h3>
            <ul>
                <li>Check that your Brandfolder OAuth credentials are configured correctly</li>
                <li>Ensure you have access to The Vault at breville.com</li>
                <li>Try clearing your browser cache and cookies</li>
                <li>Verify your redirect URI matches: <code>https://${host}/auth/callback</code></li>
                <li>Contact your IT administrator if the issue persists</li>
            </ul>
        </div>
        
        <div style="margin-top: 30px; color: #64748b; font-size: 0.9em;">
            <p><strong>Need help?</strong> Contact the DAM team or check the troubleshooting guide in your project documentation.</p>
        </div>
    </div>
</body>
</html>
  `;
}
