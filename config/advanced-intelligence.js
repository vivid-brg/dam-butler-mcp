// config/advanced-intelligence.js - Phase 3C: Advanced AI capabilities
// Visual similarity, bulk operations, and predictive recommendations

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Advanced Intelligence Features for Phase 3C
export const AdvancedIntelligence = {

  // Feature 1: Visual Similarity Search
  async findSimilarAssets(imageUrl, options = {}) {
    try {
      const analysis = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this Breville/Sage asset image and identify:
                1. Product type and model (if visible)
                2. Asset category (product photo, lifestyle, logo, etc.)
                3. Visual style and composition
                4. Use case suitability
                5. Similar assets that would complement this
                
                Respond with structured analysis for finding similar assets.`
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const analysis_text = analysis.choices[0].message.content;
      
      // Convert visual analysis to search parameters
      return this.generateSimilaritySearchParams(analysis_text, options);
      
    } catch (error) {
      console.error('Visual similarity analysis failed:', error);
      return this.fallbackSimilaritySearch(imageUrl, options);
    }
  },

  generateSimilaritySearchParams(visualAnalysis, options) {
    // Parse AI visual analysis into actionable search parameters
    const searchParams = {
      similarity_type: options.similarity_type || 'visual_style',
      confidence_threshold: options.confidence_threshold || 0.7,
      max_results: options.max_results || 10,
      search_criteria: {
        visual_style: this.extractVisualStyle(visualAnalysis),
        product_category: this.extractProductCategory(visualAnalysis),
        composition_type: this.extractComposition(visualAnalysis),
        use_case_match: this.extractUseCase(visualAnalysis)
      }
    };

    return searchParams;
  },

  // Feature 2: Bulk Operations Intelligence
  async planBulkOperation(requests, operation_type = 'download') {
    const bulkPlan = {
      operation_id: `bulk_${Date.now()}`,
      operation_type,
      total_requests: requests.length,
      estimated_time_seconds: requests.length * 2.5, // 2.5s per asset average
      batches: [],
      optimization_applied: [],
      potential_issues: []
    };

    // Group requests intelligently
    const groupedRequests = this.groupRequestsIntelligently(requests);
    
    // Create optimized batches
    bulkPlan.batches = await this.createOptimizedBatches(groupedRequests);
    
    // Predict potential issues
    bulkPlan.potential_issues = this.predictBulkIssues(requests);
    
    // Suggest optimizations
    bulkPlan.optimization_applied = this.suggestBulkOptimizations(requests);

    return bulkPlan;
  },

  groupRequestsIntelligently(requests) {
    const groups = {
      by_product: {},
      by_section: {},
      by_format: {},
      by_region: {},
      by_use_case: {}
    };

    requests.forEach((request, index) => {
      // Group by product for efficient searching
      const product = request.intent?.products?.[0]?.model || 'unknown';
      if (!groups.by_product[product]) groups.by_product[product] = [];
      groups.by_product[product].push({ ...request, index });

      // Group by section for batch processing
      const section = request.intent?.section || 'unknown';
      if (!groups.by_section[section]) groups.by_section[section] = [];
      groups.by_section[section].push({ ...request, index });

      // Group by format for format-specific optimizations
      const formats = request.intent?.formats || ['unknown'];
      formats.forEach(format => {
        if (!groups.by_format[format]) groups.by_format[format] = [];
        groups.by_format[format].push({ ...request, index });
      });
    });

    return groups;
  },

  async createOptimizedBatches(groupedRequests) {
    const batches = [];
    const batchSize = 5; // Optimal batch size for Brandfolder API

    // Process groups with highest efficiency first
    const productGroups = Object.entries(groupedRequests.by_product)
      .sort(([,a], [,b]) => b.length - a.length); // Largest groups first

    for (const [product, requests] of productGroups) {
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        batches.push({
          batch_id: `${product}_${Math.floor(i / batchSize)}`,
          product_focus: product,
          requests: batch,
          estimated_time_seconds: batch.length * 2.0, // Optimized time per request in batch
          optimization_strategy: 'product_focused_search'
        });
      }
    }

    return batches;
  },

  predictBulkIssues(requests) {
    const issues = [];

    // Check for duplicate requests
    const duplicates = this.findDuplicateRequests(requests);
    if (duplicates.length > 0) {
      issues.push({
        type: 'duplicates',
        severity: 'medium',
        count: duplicates.length,
        message: `${duplicates.length} duplicate requests detected`,
        suggestion: 'Consider deduplicating before processing'
      });
    }

    // Check for potentially problematic requests
    const problematic = requests.filter(req => 
      !req.intent?.products || req.intent.confidence < 0.5
    );
    if (problematic.length > 0) {
      issues.push({
        type: 'low_confidence',
        severity: 'high',
        count: problematic.length,
        message: `${problematic.length} requests have low confidence scores`,
        suggestion: 'Review and refine these requests before bulk processing'
      });
    }

    // Check for format conflicts
    const formatConflicts = this.detectFormatConflicts(requests);
    if (formatConflicts.length > 0) {
      issues.push({
        type: 'format_conflicts',
        severity: 'low',
        conflicts: formatConflicts,
        message: 'Some requests may have format compatibility issues',
        suggestion: 'Verify format requirements for each use case'
      });
    }

    return issues;
  },

  // Feature 3: Predictive Recommendations
  async generatePredictiveRecommendations(currentRequest, userHistory = []) {
    const recommendations = {
      complementary_assets: [],
      format_suggestions: [],
      use_case_expansions: [],
      similar_products: [],
      trending_assets: []
    };

    // Analyze current request context
    const context = this.analyzeRequestContext(currentRequest);
    
    // Generate complementary asset recommendations
    recommendations.complementary_assets = await this.findComplementaryAssets(context);
    
    // Suggest optimal formats based on use case
    recommendations.format_suggestions = this.suggestOptimalFormats(context);
    
    // Expand use case possibilities
    recommendations.use_case_expansions = this.expandUseCases(context);
    
    // Find similar products that might be relevant
    recommendations.similar_products = this.findSimilarProducts(context);
    
    // Include trending assets based on analytics
    recommendations.trending_assets = await this.getTrendingAssets(context);

    return recommendations;
  },

  analyzeRequestContext(request) {
    return {
      primary_product: request.intent?.products?.[0],
      section: request.intent?.section,
      use_case: request.intent?.use_case,
      region: request.intent?.region,
      brand: request.intent?.brand,
      formats: request.intent?.formats || [],
      confidence: request.intent?.confidence || 0,
      business_context: request.intent?.business_context
    };
  },

  async findComplementaryAssets(context) {
    const complementary = [];

    // If requesting product photo, suggest lifestyle shots
    if (context.section === 'Product Photography') {
      complementary.push({
        type: 'lifestyle_photography',
        reason: 'Lifestyle shots complement product photography',
        suggested_section: 'Lifestyle Photography',
        confidence: 0.85
      });
    }

    // If requesting logo, suggest brand guidelines
    if (context.section === 'Logos') {
      complementary.push({
        type: 'brand_guidelines',
        reason: 'Brand guidelines ensure consistent logo usage',
        suggested_section: 'Brand Guidelines',
        confidence: 0.90
      });
    }

    // If requesting social assets, suggest multiple formats
    if (context.section?.includes('Social')) {
      complementary.push({
        type: 'multi_format_social',
        reason: 'Social campaigns benefit from multiple format variations',
        suggested_formats: ['JPG', 'PNG', 'MP4', 'GIF'],
        confidence: 0.88
      });
    }

    // Business context complementary assets
    if (context.business_context === 'amazon') {
      complementary.push({
        type: 'amazon_complete_package',
        reason: 'Amazon listings perform better with complete asset packages',
        suggested_assets: ['A+ Content', 'Main Image', 'Lifestyle Images', 'Infographics'],
        confidence: 0.92
      });
    }

    return complementary;
  },

  suggestOptimalFormats(context) {
    const suggestions = [];

    // Use case specific format recommendations
    const formatMatrix = {
      'presentation': {
        primary: ['PNG', 'SVG'],
        reason: 'Transparency support and scalability for presentations',
        avoid: ['WEBP'],
        avoid_reason: 'Limited PowerPoint support'
      },
      'web': {
        primary: ['WEBP', 'SVG', 'PNG'],
        reason: 'Optimized for web performance and quality',
        consider: ['JPG'],
        consider_reason: 'For photographs without transparency needs'
      },
      'print': {
        primary: ['PDF', 'EPS', 'TIFF'],
        reason: 'High resolution and CMYK support for print',
        minimum_dpi: 300,
        avoid: ['JPG', 'PNG'],
        avoid_reason: 'RGB color space may not print accurately'
      },
      'social_media': {
        primary: ['JPG', 'PNG', 'MP4'],
        reason: 'Platform-optimized formats with good compression',
        platform_specific: {
          'instagram': ['JPG', 'MP4'],
          'facebook': ['JPG', 'PNG', 'MP4'],
          'linkedin': ['PNG', 'PDF']
        }
      },
      'email': {
        primary: ['PNG', 'JPG'],
        reason: 'Email-safe formats with universal support',
        max_file_size: '1MB',
        avoid: ['SVG', 'WEBP'],
        avoid_reason: 'Limited email client support'
      }
    };

    const useCase = context.use_case || 'general';
    const recommendation = formatMatrix[useCase] || formatMatrix['general'];

    if (recommendation) {
      suggestions.push({
        use_case: useCase,
        ...recommendation,
        confidence: 0.90
      });
    }

    return suggestions;
  },

  expandUseCases(context) {
    const expansions = [];
    const currentUseCase = context.use_case;

    // Use case expansion matrix
    const expansionMatrix = {
      'presentation': [
        { use_case: 'web', reason: 'Present online or embed in websites', confidence: 0.75 },
        { use_case: 'email', reason: 'Email presentation summaries', confidence: 0.65 },
        { use_case: 'print', reason: 'Print handouts or reports', confidence: 0.70 }
      ],
      'social_media': [
        { use_case: 'web', reason: 'Drive traffic to website', confidence: 0.80 },
        { use_case: 'email', reason: 'Email marketing campaigns', confidence: 0.75 },
        { use_case: 'print', reason: 'Print advertising materials', confidence: 0.60 }
      ],
      'amazon': [
        { use_case: 'web', reason: 'Use on official website', confidence: 0.85 },
        { use_case: 'social_media', reason: 'Promote Amazon listings', confidence: 0.80 },
        { use_case: 'email', reason: 'Email product announcements', confidence: 0.70 }
      ]
    };

    const possibleExpansions = expansionMatrix[currentUseCase] || [];
    
    possibleExpansions.forEach(expansion => {
      if (expansion.confidence > 0.6) {
        expansions.push({
          ...expansion,
          original_use_case: currentUseCase,
          suggested_assets: this.getAssetsForUseCase(expansion.use_case, context)
        });
      }
    });

    return expansions;
  },

  async getTrendingAssets(context) {
    // In production, this would query your analytics database
    // For now, return intelligent trending based on context
    
    const trending = [
      {
        asset_type: 'Oracle Jet lifestyle photography',
        trend_score: 0.95,
        reason: '23% increase in Oracle Jet requests this month',
        relevance_to_request: context.primary_product?.name === 'Oracle Jet' ? 0.90 : 0.30
      },
      {
        asset_type: 'Amazon A+ content',
        trend_score: 0.88,
        reason: '45% growth in Amazon-specific requests',
        relevance_to_request: context.business_context === 'amazon' ? 0.95 : 0.40
      },
      {
        asset_type: 'Social media assets',
        trend_score: 0.82,
        reason: 'Consistent high demand across all regions',
        relevance_to_request: context.use_case === 'social_media' ? 0.90 : 0.50
      }
    ];

    // Filter and sort by relevance to current request
    return trending
      .filter(asset => asset.relevance_to_request > 0.5)
      .sort((a, b) => b.relevance_to_request - a.relevance_to_request)
      .slice(0, 3);
  },

  // Helper functions
  findDuplicateRequests(requests) {
    const seen = new Set();
    const duplicates = [];
    
    requests.forEach((request, index) => {
      const key = JSON.stringify({
        products: request.intent?.products,
        section: request.intent?.section,
        formats: request.intent?.formats
      });
      
      if (seen.has(key)) {
        duplicates.push({ index, request });
      }
      seen.add(key);
    });
    
    return duplicates;
  },

  detectFormatConflicts(requests) {
    // Detect requests that might have conflicting format requirements
    return requests
      .filter(req => req.intent?.use_case === 'print' && req.intent?.formats?.includes('RGB'))
      .map(req => ({
        request: req,
        conflict: 'RGB format requested for print use case',
        suggestion: 'Consider CMYK formats for print'
      }));
  },

  getAssetsForUseCase(useCase, context) {
    // Return suggested asset types for expanded use cases
    const assetMatrix = {
      'web': ['Hero images', 'Product photography', 'Logos'],
      'email': ['Compact logos', 'Product highlights', 'Call-to-action assets'],
      'print': ['High-resolution photos', 'Vector logos', 'Print-ready layouts'],
      'social_media': ['Square formats', 'Story formats', 'Video content']
    };
    
    return assetMatrix[useCase] || [];
  }
};

// Export advanced intelligence for integration
export default AdvancedIntelligence;
