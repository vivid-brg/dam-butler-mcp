// api/mcp.js - Enhanced MCP endpoint that uses your smart asset search logic
import findBrandAssets from './find-brand-assets.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Return MCP capabilities for ChatGPT Enterprise
    return res.json({
      name: "dam-butler-mcp",
      version: "1.0.0",
      description: "Breville DAM Butler - Intent-based brand asset search",
      status: "ready",
      oauth_configured: !!process.env.BRANDFOLDER_CLIENT_ID,
      openai_configured: !!process.env.OPENAI_API_KEY,
      capabilities: {
        tools: [
          {
            name: "find_brand_assets",
            description: "Find brand assets using natural language. Understands Breville products, regions, and usage contexts automatically.",
            schema: {
              type: "object",
              properties: {
                request: {
                  type: "string",
                  description: "What you need in plain English (e.g., 'Oracle Jet logo for my presentation')"
                },
                context: {
                  type: "object",
                  properties: {
                    region: { type: "string", description: "User's region (AU, US, GB, etc.)" },
                    use_case: { type: "string", description: "How the asset will be used" }
                  }
                }
              },
              required: ["request"]
            }
          }
        ]
      }
    });
  }

  if (req.method === 'POST') {
    const { tool, arguments: args } = req.body || {};
    
    if (tool === 'find_brand_assets') {
      // Create a mock request object that matches the find-brand-assets.js expected format
      const mockReq = {
        method: 'POST',
        body: {
          request: args?.request,
          context: args?.context || {}
        },
        headers: req.headers,
        startTime: Date.now()
      };

      // Create a mock response object to capture the result
      let responseData = null;
      let statusCode = 200;
      
      const mockRes = {
        status: (code) => {
          statusCode = code;
          return mockRes;
        },
        json: (data) => {
          responseData = data;
          return mockRes;
        },
        setHeader: () => mockRes,
        end: () => mockRes
      };

      try {
        // Call your smart asset search logic
        await findBrandAssets(mockReq, mockRes);
        
        // Return the result in MCP format
        if (responseData) {
          if (statusCode === 200 && responseData.success) {
            // Success case - return MCP-formatted response
            return res.json({
              content: [
                {
                  type: "text",
                  text: formatSearchResults(responseData)
                }
              ]
            });
          } else {
            // Error case - return helpful error
            return res.status(statusCode).json({
              content: [
                {
                  type: "text", 
                  text: `🚨 ${responseData.message || 'Search failed'}\n\n${responseData.error ? `Error: ${responseData.error}` : ''}`
                }
              ]
            });
          }
        }
      } catch (error) {
        console.error('MCP asset search error:', error);
        return res.status(500).json({
          content: [
            {
              type: "text",
              text: `🚨 Search failed: ${error.message}\n\nTry being more specific about the product or asset type you need.`
            }
          ]
        });
      }
    }
    
    return res.status(400).json({ 
      error: 'Unknown tool',
      available_tools: ['find_brand_assets']
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function formatSearchResults(searchResult) {
  if (!searchResult.success || !searchResult.results || searchResult.results.length === 0) {
    return `🔍 No assets found for "${searchResult.intent?.originalRequest || 'your request'}"\n\n💡 Suggestions:\n${searchResult.suggestions?.map(s => `• ${s.message}`).join('\n') || '• Try being more specific about the product name\n• Check spelling of product names\n• Use broader search terms'}`;
  }

  const { intent, results } = searchResult;
  
  let output = `🎯 Found ${results.length} asset${results.length > 1 ? 's' : ''} for "${intent.originalRequest}"\n\n`;
  
  // Add intent summary
  if (intent.products.length > 0) {
    output += `📋 **Detected**: ${intent.products.map(p => p.name).join(', ')} | ${intent.assetTypes.join(', ')} | ${intent.useCase}\n\n`;
  }
  
  // Add results
  results.forEach((result, index) => {
    output += `**${index + 1}. ${result.name}**\n`;
    output += `📁 Format: ${result.format} | Size: ${result.size}\n`;
    output += `🔗 Download: ${result.url}\n`;
    output += `💡 ${result.aiSummary}\n`;
    
    if (result.usageNotes && result.usageNotes.length > 0) {
      output += result.usageNotes.map(note => `   ${note}`).join('\n') + '\n';
    }
    output += '\n';
  });

  // Add suggestions if any
  if (searchResult.suggestions && searchResult.suggestions.length > 0) {
    output += '💡 **Suggestions**:\n';
    searchResult.suggestions.forEach(suggestion => {
      output += `• ${suggestion.message}\n`;
      if (suggestion.action) {
        output += `  Try: ${suggestion.action}\n`;
      }
    });
  }

  return output;
}
