import dotenv from 'dotenv';
import axios from 'axios';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

export class BrevilleVaultMCP {
  constructor(config = {}) {
    this.config = {
      clientId: config.clientId || process.env.BRANDFOLDER_CLIENT_ID,
      clientSecret: config.clientSecret || process.env.BRANDFOLDER_CLIENT_SECRET,
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
      vaultBaseUrl: config.vaultBaseUrl || process.env.VAULT_BASE_URL || 'https://thevault.work/breville',
      vaultApiBase: config.vaultApiBase || process.env.VAULT_API_BASE || 'https://api.brandfolder.com/v4'
    };

    // Load product catalog
    try {
      const configData = readFileSync('./config/breville-config.json', 'utf8');
      this.productCatalog = JSON.parse(configData);
    } catch (error) {
      console.warn('Warning: Could not load product catalog:', error.message);
      this.productCatalog = { products: {} };
    }
  }

  /**
   * Initialize the MCP server
   */
  async initialize() {
    console.log('🚀 Initializing DAM Butler MCP Server...');
    console.log('✅ OpenAI API Key:', this.config.openaiApiKey ? 'Configured' : 'Not configured');
    console.log('✅ Brandfolder OAuth:', (this.config.clientId && this.config.clientSecret) ? 'Configured' : 'Pending');
    console.log('✅ Product Catalog:', Object.keys(this.productCatalog.products || {}).length, 'products loaded');
    return true;
  }

  /**
   * Enhanced intent parsing using OpenAI with comprehensive Breville knowledge
   */
  async parseIntentWithOpenAI(userRequest, context) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at parsing brand asset requests for Breville. Parse the user's request into structured intent.

BREVILLE PRODUCTS:
- Oracle Jet (BES985) - Premium espresso machine
- Oracle Dual Boiler (BES995) - Dual boiler espresso
- Oracle Touch (BES990) - Touchscreen espresso machine
- Sage - UK/EU brand name for Breville products
- Coffee machines, blenders, toasters, grills, accessories

ASSET TYPES:
- logo: Brand marks, product logos
- product_photography: Hero shots, technical photos
- lifestyle_photography: Lifestyle, in-use images
- marketing_materials: Campaign assets, banners
- documentation: Manuals, spec sheets

USE CASES:
- presentation: High-res, transparent backgrounds, brand compliance
- web: Optimized formats, responsive sizes
- print: CMYK, high DPI, print-ready
- social: Platform-specific sizes, engaging formats
- email: Email-safe formats, engagement-focused

REGIONS:
- AU: Australia (Breville branding)
- US: United States (Breville branding)  
- GB/UK: United Kingdom (Sage branding)
- EU/DE: Europe (Sage branding)
- CA: Canada (Breville branding)

Respond ONLY with valid JSON in this exact format:
{
  "products": [{"name": "Oracle Jet", "model": "BES985", "confidence": 0.95}],
  "assetTypes": ["logo"],
  "useCase": "presentation",
  "formats": ["PNG", "SVG"],
  "region": "global",
  "urgency": "normal",
  "confidence": 0.9,
  "reasoning": "User wants Oracle Jet logo for presentation, suggesting PNG/SVG for transparency"
}`
        },
        {
          role: 'user',
          content: `Parse this asset request: "${userRequest}"${Object.keys(context).length ? ` (Context: ${JSON.stringify(context)})` : ''}`
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${this.config.openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content.trim();
    
    // Clean up response (remove markdown formatting if present)
    const jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const aiIntent = JSON.parse(jsonString);
      
      // Enhance with original request and context
      return {
        ...aiIntent,
        originalRequest: userRequest,
        context: context,
        source: 'openai',
        timestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error('[JSON Parse Error]', parseError, 'Content:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  }

  /**
   * Enhanced fallback basic parsing with better product detection
   */
  parseIntentBasic(userRequest, context = {}) {
    const intent = {
      products: [],
      assetTypes: [],
      useCase: context.use_case || 'general',
      formats: ['PNG'],
      region: context.region || 'global',
      urgency: context.urgency || 'normal',
      confidence: 0.7,
      originalRequest: userRequest,
      source: 'basic',
      reasoning: 'Basic pattern matching used'
    };

    // Enhanced product detection
    if (/oracle jet|bes985/i.test(userRequest)) {
      intent.products.push({ name: 'Oracle Jet', model: 'BES985', confidence: 0.8 });
    }
    if (/oracle dual|bes995/i.test(userRequest)) {
      intent.products.push({ name: 'Oracle Dual Boiler', model: 'BES995', confidence: 0.8 });
    }
    if (/oracle touch|bes990/i.test(userRequest)) {
      intent.products.push({ name: 'Oracle Touch', model: 'BES990', confidence: 0.8 });
    }
    if (/sage/i.test(userRequest)) {
      intent.products.push({ name: 'Sage', model: 'UK_VARIANT', confidence: 0.8 });
    }

    // Enhanced asset type detection
    if (/logo|brand/i.test(userRequest)) intent.assetTypes.push('logo');
    if (/photo|image|shot/i.test(userRequest)) intent.assetTypes.push('photography');
    if (/lifestyle/i.test(userRequest)) intent.assetTypes.push('lifestyle_photography');
    if (/product.*(photo|shot|image)/i.test(userRequest)) intent.assetTypes.push('product_photography');
    if (/marketing|campaign|banner/i.test(userRequest)) intent.assetTypes.push('marketing_materials');

    // Enhanced use case inference
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

    // Enhanced urgency detection
    if (/urgent|asap|quickly|rush/i.test(userRequest)) {
      intent.urgency = 'high';
    }

    // Default asset type if none detected
    if (intent.assetTypes.length === 0) {
      intent.assetTypes.push('logo');
    }

    return intent;
  }

  /**
   * Main asset search method
   */
  async findBrandAssets(request, context = {}) {
    try {
      // Parse user intent
      let intent;
      if (this.config.openaiApiKey) {
        intent = await this.parseIntentWithOpenAI(request, context);
      } else {
        console.log('No OpenAI key - using basic parsing');
        intent = this.parseIntentBasic(request, context);
      }

      // For now, return mock results since we're waiting for Brandfolder OAuth
      return {
        success: true,
        intent,
        results: [],
        message: 'DAM Butler is ready! Waiting for Brandfolder OAuth setup.',
        status: 'oauth_pending'
      };
    } catch (error) {
      console.error('Asset search error:', error);
      return {
        success: false,
        error: error.message,
        intent: this.parseIntentBasic(request, context)
      };
    }
  }
}
