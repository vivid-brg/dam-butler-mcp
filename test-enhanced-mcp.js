// test-enhanced-mcp.js - Comprehensive testing suite for DAM Butler MCP Phase 2+
// Tests OpenAI integration, triple-fallback system, and regional intelligence

import { config } from 'dotenv';
config();

// Enhanced test scenarios based on your Phase 2 capabilities
const TEST_SCENARIOS = {
  // OpenAI Intelligence Tests
  openai_enhanced: [
    {
      name: "Perfect Product Match with Business Context",
      input: "Oracle Jet Amazon A+ content for APAC market",
      expected: {
        parsing_method: "openai",
        confidence_min: 0.90,
        products: [{ name: "Oracle Jet", model: "BES985" }],
        section: "Digital Assets (incl. Websites, Programmatic & EDM)",
        deliverables: ["Amazon A+"],
        region: "APAC",
        brand: "Breville"
      }
    },
    {
      name: "Regional Theater Auto-Detection",
      input: "Sage social media assets for UK market",
      expected: {
        parsing_method: "openai",
        confidence_min: 0.85,
        region: "EMEA",
        brand: "Sage",
        section: "Social (incl. Videos, Statics, Stories & Keynotes)",
        product_conversion: "BES985 → SES985"
      }
    },
    {
      name: "Complex Multi-Context Request",
      input: "Oracle Dual Boiler lifestyle photography with transparent background for Instagram stories",
      expected: {
        parsing_method: "openai",
        confidence_min: 0.88,
        products: [{ model: "BES920" }],
        section: "Lifestyle Photography",
        formats: ["PNG"],
        use_case: "social_media",
        platform_specific: "Instagram Stories"
      }
    }
  ],

  // Triple-Fallback System Tests
  fallback_system: [
    {
      name: "OpenAI Unavailable - Enhanced Pattern Match",
      input: "BES985 logo PNG presentation",
      simulate_openai_failure: true,
      expected: {
        parsing_method: "enhanced_pattern",
        confidence_min: 0.70,
        products: [{ model: "BES985", name: "Oracle Jet" }],
        section: "Logos"
      }
    },
    {
      name: "Basic Fallback - Simple Product Code",
      input: "BES920",
      disable_enhanced_parsing: true,
      expected: {
        parsing_method: "basic_fallback",
        confidence_min: 0.50,
        products: [{ model: "BES920" }]
      }
    }
  ],

  // Regional Intelligence Tests  
  regional_intelligence: [
    {
      name: "Australia Market - Breville Branding",
      input: "Oracle Touch product photography for Australian campaign",
      expected: {
        region: "APAC",
        brand: "Breville",
        model_format: "BES990"
      }
    },
    {
      name: "UK Market - Sage Branding with Model Conversion",
      input: "Oracle Jet specs for UK retail",
      expected: {
        region: "EMEA", 
        brand: "Sage",
        model_conversion: "BES985 → SES985"
      }
    },
    {
      name: "US Market - Breville Branding",
      input: "Dual Boiler manual for US customers",
      expected: {
        region: "USCM",
        brand: "Breville",
        model_format: "BES920"
      }
    }
  ],

  // Business Context Intelligence Tests
  business_context: [
    {
      name: "Amazon Context Auto-Detection",
      input: "Oracle Jet for Amazon listing",
      expected: {
        business_context: "amazon",
        section: "Digital Assets (incl. Websites, Programmatic & EDM)",
        deliverables: ["Amazon A+"],
        auto_optimization: true
      }
    },
    {
      name: "Social Media Context with Platform Detection",
      input: "Sage Instagram campaign assets",
      expected: {
        business_context: "social_media",
        section: "Social (incl. Videos, Statics, Stories & Keynotes)",
        platform_specific: "Instagram",
        format_optimization: ["JPG", "PNG", "MP4"]
      }
    },
    {
      name: "Presentation Context with Format Optimization",
      input: "Oracle Touch logo for PowerPoint presentation",
      expected: {
        business_context: "presentation",
        section: "Logos",
        format_optimization: ["PNG", "SVG"],
        transparency_preferred: true
      }
    }
  ],

  // Vault Structure Intelligence Tests
  vault_intelligence: [
    {
      name: "14 Official Sections Recognition",
      input: "Oracle Jet point of sale materials",
      expected: {
        section: "Point of Sale",
        vault_knowledge: true,
        deliverable_mapping: true
      }
    },
    {
      name: "80+ Deliverables Mapping",
      input: "T4 horizontal banner for Oracle Touch",
      expected: {
        section: "Point of Sale",
        deliverable: "T4 Horizontal",
        specific_asset_type: true
      }
    }
  ],

  // Error Handling Tests
  error_handling: [
    {
      name: "Invalid Product Code",
      input: "BES999 assets",
      expected: {
        graceful_degradation: true,
        suggestions_provided: true,
        similar_products: true
      }
    },
    {
      name: "Ambiguous Request",
      input: "coffee machine stuff",
      expected: {
        clarification_request: true,
        product_suggestions: true,
        section_recommendations: true
      }
    }
  ]
};

async function runEnhancedTests() {
  console.log('🧪 DAM Butler MCP - Enhanced Testing Suite');
  console.log('Testing Phase 2: OpenAI Intelligence Integration\n');

  const results = {
    total_tests: 0,
    passed: 0,
    failed: 0,
    errors: [],
    performance_metrics: {
      avg_response_time: 0,
      openai_success_rate: 0,
      fallback_trigger_rate: 0
    }
  };

  // Test each category
  for (const [category, tests] of Object.entries(TEST_SCENARIOS)) {
    console.log(`\n📋 Testing Category: ${category.toUpperCase()}`);
    console.log('='.repeat(50));

    for (const test of tests) {
      results.total_tests++;
      console.log(`\n🔍 ${test.name}`);
      console.log(`Input: "${test.input}"`);

      try {
        const startTime = Date.now();
        const result = await executeTest(test);
        const responseTime = Date.now() - startTime;

        if (validateTestResult(result, test.expected)) {
          console.log(`✅ PASSED (${responseTime}ms)`);
          results.passed++;
        } else {
          console.log(`❌ FAILED (${responseTime}ms)`);
          results.failed++;
          results.errors.push({
            test: test.name,
            category,
            expected: test.expected,
            actual: result
          });
        }

        // Log key results
        if (result.intent) {
          console.log(`   Method: ${result.intent.source || 'unknown'}`);
          console.log(`   Confidence: ${result.intent.confidence || 'N/A'}`);
          if (result.intent.products?.length > 0) {
            console.log(`   Products: ${result.intent.products.map(p => `${p.name} (${p.model})`).join(', ')}`);
          }
        }

      } catch (error) {
        console.log(`💥 ERROR: ${error.message}`);
        results.failed++;
        results.errors.push({
          test: test.name,
          category,
          error: error.message
        });
      }
    }
  }

  // Performance Tests
  console.log('\n🚀 Performance Testing');
  console.log('='.repeat(50));
  
  const perfResults = await runPerformanceTests();
  results.performance_metrics = perfResults;

  // Generate Report
  generateTestReport(results);
}

async function executeTest(test) {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

  // Simulate test conditions
  const requestBody = {
    request: test.input,
    context: {
      test_mode: true,
      simulate_openai_failure: test.simulate_openai_failure || false,
      disable_enhanced_parsing: test.disable_enhanced_parsing || false
    }
  };

  const response = await fetch(`${baseUrl}/api/find-brand-assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

function validateTestResult(actual, expected) {
  // Validate parsing method
  if (expected.parsing_method && actual.intent?.source !== expected.parsing_method) {
    return false;
  }

  // Validate confidence threshold
  if (expected.confidence_min && (actual.intent?.confidence || 0) < expected.confidence_min) {
    return false;
  }

  // Validate product detection
  if (expected.products) {
    const actualProducts = actual.intent?.products || [];
    for (const expectedProduct of expected.products) {
      const found = actualProducts.some(p => 
        (!expectedProduct.name || p.name === expectedProduct.name) &&
        (!expectedProduct.model || p.model === expectedProduct.model)
      );
      if (!found) return false;
    }
  }

  // Validate section mapping
  if (expected.section && actual.intent?.section !== expected.section) {
    return false;
  }

  // Validate regional detection
  if (expected.region && actual.intent?.region !== expected.region) {
    return false;
  }

  // Validate brand detection
  if (expected.brand && actual.intent?.brand !== expected.brand) {
    return false;
  }

  return true;
}

async function runPerformanceTests() {
  console.log('\n⏱️  Response Time Test');
  
  const testRequests = [
    "Oracle Jet logo",
    "Sage social media assets for UK",
    "BES985 Amazon A+ content", 
    "Dual Boiler lifestyle photography",
    "Oracle Touch presentation materials"
  ];

  const times = [];
  let openaiSuccesses = 0;
  let fallbackTriggers = 0;

  for (const request of testRequests) {
    const startTime = Date.now();
    try {
      const result = await executeTest({ input: request });
      const responseTime = Date.now() - startTime;
      times.push(responseTime);
      
      if (result.intent?.source === 'openai') openaiSuccesses++;
      if (result.intent?.source !== 'openai') fallbackTriggers++;
      
      console.log(`   "${request}": ${responseTime}ms (${result.intent?.source || 'unknown'})`);
    } catch (error) {
      console.log(`   "${request}": ERROR - ${error.message}`);
    }
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`\n📊 Average Response Time: ${Math.round(avgTime)}ms`);
  
  return {
    avg_response_time: Math.round(avgTime),
    openai_success_rate: openaiSuccesses / testRequests.length,
    fallback_trigger_rate: fallbackTriggers / testRequests.length
  };
}

function generateTestReport(results) {
  console.log('\n📊 TEST REPORT');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.total_tests}`);
  console.log(`Passed: ${results.passed} (${Math.round(results.passed / results.total_tests * 100)}%)`);
  console.log(`Failed: ${results.failed} (${Math.round(results.failed / results.total_tests * 100)}%)`);
  
  console.log('\n🚀 Performance Metrics:');
  console.log(`Average Response Time: ${results.performance_metrics.avg_response_time}ms`);
  console.log(`OpenAI Success Rate: ${Math.round(results.performance_metrics.openai_success_rate * 100)}%`);
  console.log(`Fallback Trigger Rate: ${Math.round(results.performance_metrics.fallback_trigger_rate * 100)}%`);

  if (results.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.errors.forEach(error => {
      console.log(`   • ${error.test} (${error.category})`);
      if (error.error) {
        console.log(`     Error: ${error.error}`);
      }
    });
  }

  // Grade the overall system
  const grade = getSystemGrade(results);
  console.log(`\n🏆 Overall Grade: ${grade.letter} (${grade.score}/100)`);
  console.log(`Status: ${grade.status}`);
}

function getSystemGrade(results) {
  const successRate = results.passed / results.total_tests;
  const avgResponseTime = results.performance_metrics.avg_response_time;
  
  let score = 0;
  
  // Success rate scoring (60 points max)
  score += Math.round(successRate * 60);
  
  // Performance scoring (25 points max)
  if (avgResponseTime < 300) score += 25;
  else if (avgResponseTime < 500) score += 20;
  else if (avgResponseTime < 1000) score += 15;
  else if (avgResponseTime < 2000) score += 10;
  else score += 5;
  
  // OpenAI integration scoring (15 points max)
  score += Math.round(results.performance_metrics.openai_success_rate * 15);
  
  let letter, status;
  if (score >= 90) { letter = 'A+'; status = 'Production Ready'; }
  else if (score >= 85) { letter = 'A'; status = 'Excellent'; }
  else if (score >= 80) { letter = 'B+'; status = 'Very Good'; }
  else if (score >= 75) { letter = 'B'; status = 'Good'; }
  else if (score >= 70) { letter = 'C+'; status = 'Acceptable'; }
  else { letter = 'C'; status = 'Needs Improvement'; }
  
  return { score, letter, status };
}

// Run the tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEnhancedTests().catch(console.error);
}

export { runEnhancedTests };
