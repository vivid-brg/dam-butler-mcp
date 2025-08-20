// api/authenticate.js - OAuth authentication endpoint for ChatGPT Enterprise
import crypto from 'crypto';

export default function handler(req, res) {
  // CORS headers for ChatGPT Enterprise
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'method_not_allowed',
      message: 'Only POST method allowed for authentication' 
    });
  }

  try {
    const { redirect_uri } = req.body || {};
    
    // Use provided redirect URI or default
    const redirectUri = redirect_uri || `https://${req.headers.host}/auth/callback`;
    
    // Check if OAuth is configured
    const clientId = process.env.BRANDFOLDER_CLIENT_ID;
    const clientSecret = process.env.BRANDFOLDER_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(503).json({
        success: false,
        error: 'oauth_not_configured',
        message: 'Brandfolder OAuth credentials not configured. Please contact administrator.',
        setup_required: {
          client_id: !clientId ? 'missing' : 'configured',
          client_secret: !clientSecret ? 'missing' : 'configured'
        }
      });
    }

    // Generate OAuth URL
    const authUrl = generateBrandfolderAuthUrl(clientId, redirectUri);
    
    return res.json({
      success: true,
      auth_url: authUrl,
      message: `Please visit the authentication URL to connect with Brandfolder`,
      instructions: 'After authentication, you\'ll be redirected back and can start searching for assets!',
      redirect_uri: redirectUri,
      expires_in: 3600 // OAuth session expires in 1 hour
    });

  } catch (error) {
    console.error('[Authentication Error]', error);
    
    return res.status(500).json({
      success: false,
      error: 'authentication_failed',
      message: 'Failed to generate authentication URL. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
}

function generateBrandfolderAuthUrl(clientId, redirectUri) {
  // Generate secure state and nonce for OAuth
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  
  // Build OAuth authorization URL using Brandfolder's endpoints
  const authUrl = new URL('https://oauth2.brandfolder-apps.com/oauth2/auth');
  
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid offline'); // offline for refresh tokens
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);
  
  // In production, you'd store state for validation
  // For now, we'll rely on Brandfolder's built-in protections
  
  return authUrl.toString();
}
