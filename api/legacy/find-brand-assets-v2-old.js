// api/find-brand-assets.js - Enhanced with Breville Vault Intelligence
import { 
  BREVILLE_PRODUCTS, 
  ASSET_SECTIONS, 
  REGIONAL_MAPPING,
  USE_CASE_OPTIMIZATION,
  findProduct, 
  findBestSections 
} from '../config/breville-vault-intelligence.js';

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

    // Execute enhanced asset search
    const searchResult = await executeAssetSearch(request, context);

    // Return results with enhanced intelligence
    return res.json({
      success: true,
      intent: searchResult.intent,
      results: searchResult.results,
      suggestions: searchResult.suggestions,
      intelligence: {
        detected_sections: searchResult.intent.sections?.map(s => s.section?.section || s),
        regional_context: searchResult.intent.regionalContext,
        confidence_score: searchResult.intent.confidence
      },
      metadata: {
        query: request,
        timestamp: new Date().toISOString(),
        response_time: `${Date.now() - (req.startTime || Date.now())}ms`
      }
    });

  } catch (error) {
    console.error('[Enhanced Asset Search Error]', error);

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

// Enhanced asset search logic with intelligence
async function executeAssetSearch(userRequest, context) {
  // Parse intent with enhanced intelligence
  const intent = parseUserIntentEnhanced(userRequest, context);
  
  // Generate intelligent mock results based on enhanced intent
  const mockResults = generateIntelligentMockResults(intent);
  
  // Generate smart suggestions
  const suggestions = generateEnhancedSuggestions(intent, mockResults);
  
  return {
    intent: intent,
    results: mockResults,
    suggestions: suggestions
  };
}

// Enhanced intent parsing with Breville intelligence
function parseUserIntentEnhanced(userRequest, context = {}) {
  const intent = {
    products: [],
    sections: [],
    assetTypes: [],
    specificDeliverables: [],
    useCase: context.use_case || inferUseCase(userRequest),
    formats: ['PNG'],
    region: context.region || inferRegion(userRequest),
    brand: null,
    regionalContext: null,
    confidence: 0.7,
    originalRequest: userRequest,
    reasoning: []
  };

  // 1. Smart product detection using intelligence config
  const detectedProduct = findProduct(userRequest);
  if (detectedProduct) {
    intent.products.push(detectedProduct);
    intent.reasoning.push(`Detected product: ${detectedProduct.name} (${detectedProduct.modelNumber})`);
    intent.confidence += 0.15;
  }

  // 2. Smart section detection
  const bestSections = findBestSections(userRequest, intent.useCase);
  if (bestSections.length > 0) {
    intent.sections = bestSections.slice(0, 2); // Top 2 matches
    intent.reasoning.push(`Targeting sections: ${bestSections.map(s => s.section.section).join(', ')}`);
    intent.confidence += 0.1;
  }

  // 3. Regional and brand context
  if (intent.region && intent.region !== 'global') {
    const regionalInfo = REGIONAL_MAPPING[intent.region.toUpperCase()];
    if (regionalInfo) {
      intent.brand = regionalInfo.brand;
      intent.regionalContext = regionalInfo;
      intent.reasoning.push(`Region: ${intent.region} → Brand: ${intent.brand}`);
      
      // Adjust product model for region
      if (intent.products.length > 0 && intent.brand === 'Sage') {
        const product = intent.products[0];
        if (product.sageModel) {
          intent.reasoning.push(`Using Sage model: ${product.sageModel} instead of ${product.modelNumber}`);
        }
      }
    }
  }

  // 4. Use case optimization
  const useCaseConfig = USE_CASE_OPTIMIZATION[intent.useCase];
  if (useCaseConfig) {
    intent.formats = useCaseConfig.preferredFormats;
    intent.usageNotes = useCaseConfig.notes;
    intent.reasoning.push(`Use case: ${intent.useCase} → Formats: ${intent.formats.join(', ')}`);
  }

  // 5. Extract specific deliverables from sections
  intent.sections.forEach(sectionMatch => {
    if (sectionMatch.section && sectionMatch.section.deliverables) {
      // Add relevant deliverables based on the request
      const relevantDeliverables = sectionMatch.section.deliverables.filter(deliverable => {
        return sectionMatch.section.keywords.some(keyword => 
          userRequest.toLowerCase().includes(keyword.toLowerCase())
        );
      });
      intent.specificDeliverables.push(...relevantDeliverables.slice(0, 3));
    }
  });

  // 6. Legacy asset type extraction (for backward compatibility)
  intent.assetTypes = intent.sections.map(s => s.sectionKey || 'general');

  return intent;
}

// Smart use case inference
function inferUseCase(userRequest) {
  const request = userRequest.toLowerCase();
  
  if (/presentation|slide|ppt|powerpoint/i.test(request)) return 'presentation';
  if (/web|website|online|digital/i.test(request)) return 'web';
  if (/social|instagram|facebook|twitter|linkedin/i.test(request)) return 'social';
  if (/amazon|marketplace|ecommerce/i.test(request)) return 'amazon';
  if (/retail|store|pos|point.of.sale/i.test(request)) return 'retail';
  if (/print|brochure|flyer|poster/i.test(request)) return 'print';
  if (/email|edm|newsletter/i.test(request)) return 'email';
  
  return 'general';
}

// Smart region inference
function inferRegion(userRequest) {
  const request = userRequest.toLowerCase();
  
  if (/australia|australian|au\b/i.test(request)) return 'AU';
  if (/america|usa|us\b|united states/i.test(request)) return 'US';
  if (/canada|canadian|ca\b/i.test(request)) return 'CA';
  if (/uk\b|britain|british|united kingdom/i.test(request)) return 'GB';
  if (/germany|german|de\b|deutschland/i.test(request)) return 'DE';
  if (/europe|european|eu\b/i.test(request)) return 'EU';
  if (/sage/i.test(request)) return 'GB'; // Sage implies UK/EU market
  
  return 'global';
}

// Generate intelligent mock results based on enhanced intent
function generateIntelligentMockResults(intent) {
  const results = [];
  
  // Generate product-specific results
  if (intent.products.length > 0) {
    const product = intent.products[0];
    const modelToUse = (intent.brand === 'Sage' && product.sageModel) ? product.sageModel : product.modelNumber;
    
    // Generate assets based on detected sections
    intent.sections.forEach((sectionMatch, index) => {
      const section = sectionMatch.section;
      const primaryFormat = intent.formats[0] || 'PNG';
      
      // Create intelligent asset based on section type
      const asset = {
        id: `asset_${Date.now()}_${index}`,
        name: generateIntelligentAssetName(product, section, intent),
        url: `https://vault.breville.com/download/${modelToUse}_${section.section.replace(/\s+/g, '_').toLowerCase()}`,
        thumbnail: `https://vault.breville.com/thumb/${modelToUse}_${section.section.replace(/\s+/g, '_').toLowerCase()}`,
        format: primaryFormat,
        size: getOptimalSize(section.section, intent.useCase),
        section: section.section,
        deliverableType: intent.specificDeliverables[index] || section.deliverables[0],
        aiSummary: generateIntelligentSummary(product, section, intent),
        usageNotes: generateIntelligentUsageNotes(section, intent),
        regionalContext: intent.regionalContext
      };
      
      results.push(asset);
    });
  }
  
  // If no specific sections detected, generate generic logo result
  if (results.length === 0) {
    results.push({
      id: 'asset_generic_001',
      name: intent.products.length > 0 ? 
        `${intent.products[0].name} - Brand Logo` : 
        'Breville Logo - Primary',
      url: 'https://vault.breville.com/download/generic_logo',
      thumbnail: 'https://vault.breville.com/thumb/generic_logo',
      format: intent.formats[0] || 'PNG',
      size: '2048x1024',
      section: 'Logos',
      deliverableType: 'Brands & Logos',
      aiSummary: `${intent.brand || 'Breville'} logo in ${intent.formats[0]} format. Perfect for ${intent.useCase} use.`,
      usageNotes: generateGenericUsageNotes(intent)
    });
  }
  
  return results.slice(0, 3); // Limit to top 3 results
}

// Generate intelligent asset names
function generateIntelligentAssetName(product, sectionMatch, intent) {
  const section = sectionMatch.section;
  const brand = intent.brand || 'Breville';
  
  if (section.section === 'Logos') {
    return `${product.name} - ${brand} Logo`;
  } else if (section.section === 'Product Photography') {
    return `${product.name} - Hero Photography`;
  } else if (section.section === 'Lifestyle Photography') {
    return `${product.name} - Lifestyle Shot`;
  } else if (section.section.includes('Social')) {
    return `${product.name} - Social Media Asset`;
  } else if (section.section.includes('Digital')) {
    return `${product.name} - ${intent.useCase === 'amazon' ? 'Amazon A+' : 'Digital'} Asset`;
  } else {
    return `${product.name} - ${section.section}`;
  }
}

// Generate intelligent summaries
function generateIntelligentSummary(product, sectionMatch, intent) {
  const section = sectionMatch.section;
  const format = intent.formats[0];
  const useCase = intent.useCase;
  const brand = intent.brand || 'Breville';
  
  let summary = `${product.name} asset from ${section.section} in ${format} format.`;
  
  if (useCase === 'presentation') {
    summary += ' Optimized for presentations with high resolution.';
  } else if (useCase === 'social') {
    summary += ' Social media ready with engaging composition.';
  } else if (useCase === 'amazon') {
    summary += ' Amazon marketplace optimized for product listings.';
  } else if (useCase === 'retail') {
    summary += ' Print-ready for retail point-of-sale use.';
  }
  
  if (intent.regionalContext) {
    summary += ` Features ${brand} branding for ${intent.regionalContext.theater} market.`;
  }
  
  return summary;
}

// Generate intelligent usage notes
function generateIntelligentUsageNotes(sectionMatch, intent) {
  const notes = [];
  const section = sectionMatch.section;
  const useCaseConfig = USE_CASE_OPTIMIZATION[intent.useCase];
  
  // Format-specific notes
  if (intent.formats.includes('PNG')) {
    notes.push('✅ PNG format with transparency support');
  }
  if (intent.formats.includes('SVG')) {
    notes.push('✅ Vector format - scales perfectly at any size');
  }
  
  // Use case specific notes
  if (useCaseConfig && useCaseConfig.notes) {
    useCaseConfig.notes.forEach(note => notes.push(`✅ ${note}`));
  }
  
  // Section-specific notes
  if (section.section === 'Product Photography') {
    notes.push('✅ Hero quality for web product pages');
  } else if (section.section === 'Lifestyle Photography') {
    notes.push('✅ Shows product in natural kitchen environment');
  } else if (section.section.includes('Social')) {
    notes.push('✅ Optimized for social media engagement');
  }
  
  // Regional notes
  if (intent.regionalContext) {
    notes.push(`✅ ${intent.brand} branding for ${intent.region} market`);
  }
  
  return notes;
}

// Get optimal size based on section and use case
function getOptimalSize(sectionName, useCase) {
  if (sectionName === 'Logos') {
    return useCase === 'presentation' ? '4096x2048' : '2048x1024';
  } else if (sectionName === 'Product Photography') {
    return '4096x4096';
  } else if (sectionName.includes('Social')) {
    return '1080x1080';
  } else if (sectionName.includes('Digital')) {
    return useCase === 'amazon' ? '2000x2000' : '1920x1080';
  }
  return '2048x1024';
}

// Generate generic usage notes
function generateGenericUsageNotes(intent) {
  const notes = [];
  
  if (intent.useCase === 'presentation') {
    notes.push('✅ High resolution ideal for presentations');
    notes.push('✅ Transparent background supported');
  } else if (intent.useCase === 'web') {
    notes.push('✅ Web-optimized format and compression');
    notes.push('✅ Fast loading for online use');
  } else if (intent.useCase === 'social') {
    notes.push('✅ Social media platform ready');
    notes.push('✅ Engaging visual composition');
  }
  
  return notes;
}

// Generate enhanced suggestions
function generateEnhancedSuggestions(intent, results) {
  const suggestions = [];
  
  if (results.length === 0) {
    suggestions.push({
      type: 'no_results',
      message: 'No assets found with current filters.',
      action: intent.products.length > 0 ? 
        `Try: "${intent.products[0].name} photography" or just "${intent.products[0].name}"` :
        'Try: "Oracle Jet" or "coffee machine assets"'
    });
  }
  
  if (intent.products.length === 0) {
    suggestions.push({
      type: 'add_product',
      message: 'For better results, specify a Breville product.',
      action: 'Try: "Oracle Jet logo" or "Sage Oracle Dual Boiler photos"'
    });
  }
  
  if (intent.confidence < 0.8) {
    suggestions.push({
      type: 'improve_specificity',
      message: 'For more targeted results, be more specific about your needs.',
      action: 'Try: "Oracle Jet product photos for Amazon listing" or "Sage logo for UK presentation"'
    });
  }
  
  if (intent.useCase === 'general') {
    suggestions.push({
      type: 'specify_use_case',
      message: 'Specify how you\'ll use these assets for optimized recommendations.',
      action: 'Try adding: "for my presentation", "for social media", or "for Amazon listing"'
    });
  }
  
  if (intent.region === 'global' && intent.products.length > 0) {
    suggestions.push({
      type: 'specify_region',
      message: 'Specify your region for brand-appropriate assets.',
      action: 'Try adding: "for UK market" (Sage) or "for Australian market" (Breville)'
    });
  }
  
  // Smart cross-section suggestions
  if (results.length > 0 && intent.sections.length === 1) {
    const currentSection = intent.sections[0].section.section;
    if (currentSection === 'Product Photography') {
      suggestions.push({
        type: 'explore_more',
        message: 'Also consider lifestyle photography for more engaging visuals.',
        action: `Try: "${intent.originalRequest.replace(/product|photo/gi, 'lifestyle')}"`
      });
    } else if (currentSection.includes('Social')) {
      suggestions.push({
        type: 'explore_more',
        message: 'Consider video content for higher social engagement.',
        action: `Try: "${intent.products[0]?.name || 'product'} demo video" or "tutorial video"`
      });
    }
  }
  
  return suggestions;
}
