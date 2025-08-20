// api/schema.js - Serves OpenAPI schema for ChatGPT Enterprise
export default function handler(req, res) {
  // CORS headers for ChatGPT Enterprise
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // OpenAPI 3.1.0 Schema for DAM Butler
  const openApiSchema = {
    openapi: "3.1.0",
    info: {
      title: "DAM Butler - Breville Asset Discovery API",
      description: "Intent-based brand asset discovery for Breville's digital asset management. Find logos, product photos, lifestyle shots, and marketing materials using natural language.",
      version: "1.0.0",
      contact: {
        name: "Breville DAM Butler",
        url: `https://${req.headers.host}`
      }
    },
    servers: [
      {
        url: `https://${req.headers.host}/api`,
        description: "Production DAM Butler MCP Server"
      }
    ],
    paths: {
      "/find-brand-assets": {
        post: {
          operationId: "findBrandAssets",
          summary: "Find brand assets using natural language",
          description: `Find Breville brand assets using natural language queries. The system understands:
- Product names (Oracle Jet, Sage, etc.)
- Asset types (logos, product photos, lifestyle shots)  
- Use cases (presentation, web, print, social media)
- Regions (AU, US, UK, EU, CA)

Examples:
- "Oracle Jet logo for my presentation"
- "Sage product photos for UK website"  
- "Red coffee machine lifestyle shots for social media"
- "High-res lifestyle images for print campaign"`,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    request: {
                      type: "string",
                      description: "Natural language description of what you need",
                      example: "Oracle Jet logo for my presentation",
                      minLength: 3,
                      maxLength: 500
                    },
                    context: {
                      type: "object",
                      description: "Additional context to improve results",
                      properties: {
                        use_case: {
                          type: "string",
                          enum: ["presentation", "web", "print", "social", "email", "general"],
                          description: "Primary use case for the assets"
                        },
                        region: {
                          type: "string", 
                          enum: ["AU", "US", "CA", "GB", "DE", "EU", "EMEA", "APAC"],
                          description: "Target market/region"
                        },
                        urgency: {
                          type: "string",
                          enum: ["low", "normal", "high", "urgent"],
                          description: "How quickly you need the assets"
                        },
                        team: {
                          type: "string",
                          description: "Your team name for usage tracking"
                        }
                      }
                    }
                  },
                  required: ["request"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Brand assets found successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                        description: "Whether the search was successful"
                      },
                      intent: {
                        type: "object",
                        description: "Parsed user intent",
                        properties: {
                          products: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                name: { type: "string", example: "Oracle Jet" },
                                model: { type: "string", example: "BES985" }
                              }
                            }
                          },
                          assetTypes: {
                            type: "array",
                            items: { type: "string" },
                            example: ["logo", "product_photo"]
                          },
                          useCase: { type: "string", example: "presentation" },
                          formats: {
                            type: "array", 
                            items: { type: "string" },
                            example: ["PNG", "SVG"]
                          }
                        }
                      },
                      results: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string", description: "Unique asset identifier" },
                            name: { type: "string", example: "Oracle Jet Logo - Primary" },
                            url: { type: "string", format: "uri", description: "Direct download URL" },
                            thumbnail: { type: "string", format: "uri", description: "Thumbnail preview URL" },
                            format: { type: "string", example: "PNG" },
                            size: { type: "string", example: "2048x1024" },
                            aiSummary: { 
                              type: "string", 
                              example: "Oracle Jet Logo - Primary in PNG format with transparency. Perfect for presentation use."
                            },
                            usageNotes: {
                              type: "array",
                              items: { type: "string" },
                              example: ["✅ PNG format ideal for presentations", "✅ High resolution, suitable for print"]
                            }
                          }
                        }
                      },
                      suggestions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            type: { type: "string" },
                            message: { type: "string" },
                            action: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Invalid search request",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string" },
                      message: { type: "string" }
                    }
                  }
                }
              }
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string", example: "authentication_required" },
                      message: { type: "string", example: "Please authenticate with Brandfolder to access assets" },
                      auth_url: { type: "string", format: "uri" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/authenticate": {
        post: {
          operationId: "startAuthentication",
          summary: "Start Brandfolder authentication flow", 
          description: "Initiate OAuth authentication with Brandfolder",
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    redirect_uri: {
                      type: "string",
                      format: "uri",
                      description: "OAuth redirect URI (optional)",
                      example: `https://${req.headers.host}/auth/callback`
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Authentication URL provided",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      auth_url: { type: "string", format: "uri" },
                      message: { type: "string" },
                      instructions: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/health": {
        get: {
          operationId: "getHealthStatus",
          summary: "Health check",
          description: "Check server health and configuration status",
          responses: {
            "200": {
              description: "Server is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", enum: ["healthy", "unhealthy"] },
                      timestamp: { type: "string", format: "date-time" },
                      version: { type: "string" },
                      oauth_status: { type: "string", enum: ["configured", "pending"] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  // Return the schema
  res.setHeader('Content-Type', 'application/json');
  return res.json(openApiSchema);
}
