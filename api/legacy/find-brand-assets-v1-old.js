// api/find-brand-assets.js - Main asset search endpoint for ChatGPT Enterprise
export default async function handler(req, res) {
  // CORS headers for ChatGPT Enterprise
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'method_not_allowed',
      message: 'Only POST method allowed for asset search' 
    });
  }

  try {
    const { request, context = {} } = req.body;

    // Validate request
    if (!request || typeof request !== 'string') {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Request field is required and must be a string',
        example: 'Oracle Jet logo for my presentation'
      });
    }

    if (request.length < 3 || request.length > 500) {
      return res.status(400).json({
        error: 'invalid_request_length',
        message: 'Request must be between 3 and 500 characters'
      });
    }

    // Check authentication status
    const hasOAuth = !!process.env.BRANDFOLDER_CLIENT_ID && !!process.env.BRANDFOLDER_CLIENT_SECRET;
    
    if (!hasOAuth) {
      return res.status(401).json({
        error: 'authentication_required',
        message: 'Brandfolder OAuth not configured. Please complete setup.',
        auth_url: `https://${req.headers.host}/authenticate`,
        setup_status: 'oauth_pending'
      });
    }

    // Initialize DAM Butler (simplified version of our MCP server logic)
    const searchResult = await executeAssetSearch(request, context);

    // Return results
    return res.json({
      success: true,
      intent: searchResult.intent,
      results: searchResult.results,
      suggestions: searchResult.suggestions,
      metadata: {
        query: request,
        timestamp: new Date().toISOString(),
        response_time: `${Date.now() - req.startTime}ms`
      }
    });

  } catch (error) {
    console.error('[Asset Search Error]', error);

    // Handle specific error types
    if (error.message.includes('authenticate')) {
      return res.status(401).json({
        error: 'authentication_required',
        message: 'Please authenticate with Brandfolder to access assets',
        auth_url: `https://${req.headers.host}/authenticate`
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Please wait a moment and try again.',
        retry_after: 60
      });
    }

    // Generic server error
    return res.status(500).json({
      error: 'search_failed',
      message: 'Asset search failed. Please try again or contact support.',
      timestamp: new Date().toISOString()
    });
  }
}

// Asset search logic (extracted from our MCP server)
async function executeAssetSearch(userRequest, context) {
  // Parse intent from natural language
  const intent = parseUserIntent(userRequest, context);
  
  // For now, return mock results that demonstrate the structure
  // This will be replaced with real Brandfolder API calls once OAuth is set up
  const mockResults = generateMockResults(intent);
  
  return {
    intent: intent,
    results: mockResults,
    suggestions: generateSuggestions(intent, mockResults)
  };
}

function parseUserIntent(userRequest, context = {}) {
  const intent = {
    products: [],
    assetTypes: [],
    useCase: context.use_case || 'general',
    formats: ['PNG'],
    region: context.region || 'global',
    originalRequest: userRequest
  };

  // Extract product references
  if (/oracle jet|bes985/i.test(userRequest)) {
    intent.products.push({ name: 'Oracle Jet', model: 'BES985' });
  }
  if (/sage/i.test(userRequest)) {
    intent.products.push({ name: 'Sage', model: 'UK_VARIANT' });
  }

  // Extract asset types
  if (/logo|brand/i.test(userRequest)) intent.assetTypes.push('logo');
  if (/photo|image|shot/i.test(userRequest)) intent.assetTypes.push('photography');
  if (/lifestyle/i.test(userRequest)) intent.assetTypes.push('lifestyle');
  if (/product.*(photo|shot|image)/i.test(userRequest)) intent.assetTypes.push('product_photography');

  // Infer use case from request if not provided in context
  if (!context.use_case) {
    if (/presentation|slide|ppt/i.test(userRequest)) {
      intent.useCase = 'presentation';
      intent.formats = ['PNG', 'SVG']; // Transparent backgrounds
    } else if (/web|website|online/i.test(userRequest)) {
      intent.useCase = 'web';
      intent.formats = ['PNG', 'WebP'];
    } else if (/social|facebook|instagram|twitter/i.test(userRequest)) {
      intent.useCase = 'social';
      intent.formats = ['PNG', 'JPG'];
    } else if (/print|poster|brochure/i.test(userRequest)) {
      intent.useCase = 'print';
      intent.formats = ['PDF', 'EPS', 'PNG'];
    }
  }

  // Default asset type if none detected
  if (intent.assetTypes.length === 0) {
    intent.assetTypes.push('logo');
  }

  return intent;
}

function generateMockResults(intent) {
  // Mock results that demonstrate the expected structure
  // This will be replaced with real Brandfolder API results
  
  const baseResults = [
    {
      id: 'asset_001',
      name: `${intent.products[0]?.name || 'Product'} Logo - Primary`,
      url: 'https://example.com/download/asset_001',
      thumbnail: 'https://example.com/thumb/asset_001',
      format: intent.formats[0] || 'PNG',
      size: '2048x1024',
      aiSummary: `${intent.products[0]?.name || 'Product'} logo in ${intent.formats[0]} format. Perfect for ${intent.useCase} use.`,
      usageNotes: generateUsageNotes(intent)
    }
  ];

  // Add more results based on intent
  if (intent.assetTypes.includes('photography')) {
    baseResults.push({
      id: 'asset_002',
      name: `${intent.products[0]?.name || 'Product'} - Hero Photography`,
      url: 'https://example.com/download/asset_002',
      thumbnail: 'https://example.com/thumb/asset_002',
      format: 'JPG',
      size: '4096x2048',
      aiSummary: `High-resolution product photography. Ideal for ${intent.useCase} applications.`,
      usageNotes: ['✅ High resolution, print-ready', '✅ Professional studio lighting']
    });
  }

  return baseResults;
}

function generateUsageNotes(intent) {
  const notes = [];
  
  if (intent.useCase === 'presentation') {
    notes.push('✅ Optimized for slide presentations');
    if (intent.formats.includes('PNG')) {
      notes.push('✅ Transparent background ideal for overlays');
    }
  }
  
  if (intent.useCase === 'web') {
    notes.push('✅ Web-optimized format and size');
    notes.push('✅ Fast loading for online use');
  }

  if (intent.useCase === 'print') {
    notes.push('✅ High resolution, print-ready');
    notes.push('✅ CMYK color space compatible');
  }

  if (intent.useCase === 'social') {
    notes.push('✅ Social media optimized dimensions');
    notes.push('✅ Engaging visual composition');
  }

  return notes;
}

function generateSuggestions(intent, results) {
  const suggestions = [];
  
  if (results.length === 0) {
    suggestions.push({
      type: 'no_results',
      message: 'No assets found. Try searching with just the product name or a broader term.',
      action: 'Try: "Oracle Jet" or "coffee machine logos"'
    });
  }

  if (intent.products.length === 0) {
    suggestions.push({
      type: 'add_product',
      message: 'For better results, specify a Breville product name.',
      action: 'Try: "Oracle Jet logo" or "Sage product photos"'
    });
  }

  if (intent.useCase === 'general') {
    suggestions.push({
      type: 'specify_use_case',
      message: 'Specify how you\'ll use these assets for optimized recommendations.',
      action: 'Try: "for my presentation" or "for website header"'
    });
  }

  return suggestions;
}
