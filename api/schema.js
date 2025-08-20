openapi: 3.1.0
info:
  title: DAM Butler - Breville Asset Discovery API
  description: Intent-based brand asset discovery for Breville's digital asset management. Find logos, product photos, lifestyle shots, and marketing materials using natural language.
  version: 1.0.0
  contact:
    name: Breville DAM Butler
    url: https://dam-butler-mcp.vercel.app
servers:
  - url: https://dam-butler-mcp.vercel.app/api
    description: Production DAM Butler MCP Server

paths:
  /mcp:
    get:
      operationId: getMCPCapabilities
      summary: Get MCP server capabilities and status
      description: Returns information about available tools and server status
      responses:
        '200':
          description: MCP server capabilities
          content:
            application/json:
              schema:
                type: object
                properties:
                  name:
                    type: string
                    example: "dam-butler-mcp"
                  version:
                    type: string
                    example: "1.0.0"
                  description:
                    type: string
                    example: "Breville DAM Butler - Intent-based brand asset search"
                  status:
                    type: string
                    enum: [ready, oauth_pending, error]
                  oauth_configured:
                    type: boolean
                  capabilities:
                    type: object
    
    post:
      operationId: executeMCPTool
      summary: Execute DAM Butler tools
      description: Execute brand asset discovery tools using natural language
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                tool:
                  type: string
                  enum: [find_brand_assets, authenticate_brandfolder]
                  description: The tool to execute
                arguments:
                  type: object
                  description: Tool-specific arguments
              required: [tool, arguments]
      responses:
        '200':
          description: Tool execution result
          content:
            application/json:
              schema:
                type: object
                properties:
                  tool:
                    type: string
                  result:
                    type: object
                  timestamp:
                    type: string
                    format: date-time
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /find-brand-assets:
    post:
      operationId: findBrandAssets
      summary: Find brand assets using natural language
      description: |
        Find Breville brand assets using natural language. Understands products (Oracle Jet, Sage), asset types (logos, photos), use cases (presentation, web, print), and regions (AU, US, UK, EU, CA).
        
        Examples: "Oracle Jet logo for my presentation" or "Sage product photos for UK website"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                request:
                  type: string
                  description: Natural language description of what you need
                  example: "Oracle Jet logo for my presentation"
                  minLength: 3
                  maxLength: 500
                context:
                  type: object
                  description: Additional context to improve results
                  properties:
                    use_case:
                      type: string
                      enum: [presentation, web, print, social, email, general]
                      description: Primary use case for the assets
                    region:
                      type: string
                      enum: [AU, US, CA, GB, DE, EU, EMEA, APAC]
                      description: Target market/region
                    urgency:
                      type: string
                      enum: [low, normal, high, urgent]
                      description: How quickly you need the assets
                    team:
                      type: string
                      description: Your team name for usage tracking
              required: [request]
      responses:
        '200':
          description: Brand assets found successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AssetSearchResult'
        '400':
          description: Invalid search request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Authentication required
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthError'
        '500':
          description: Search failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /authenticate:
    post:
      operationId: startAuthentication
      summary: Start Brandfolder authentication flow
      description: Initiate OAuth authentication with Brandfolder
      requestBody:
        required: false
        content:
          application/json:
            schema:
              type: object
              properties:
                redirect_uri:
                  type: string
                  format: uri
                  description: OAuth redirect URI (optional)
                  example: "https://dam-butler-mcp.vercel.app/auth/callback"
      responses:
        '200':
          description: Authentication URL provided
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  auth_url:
                    type: string
                    format: uri
                    description: URL to visit for authentication
                  message:
                    type: string
                    description: Instructions for the user
                  instructions:
                    type: string
                    description: What to do after authentication

  /health:
    get:
      operationId: getHealthStatus
      summary: Health check
      description: Check server health and configuration status
      responses:
        '200':
          description: Server is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum: [healthy, unhealthy]
                  timestamp:
                    type: string
                    format: date-time
                  version:
                    type: string
                  environment:
                    type: string
                  oauth_status:
                    type: string
                    enum: [configured, pending]
                  endpoints:
                    type: object
                    properties:
                      mcp:
                        type: string
                        format: uri
                      health:
                        type: string
                        format: uri

components:
  schemas:
    AssetSearchResult:
      type: object
      properties:
        success:
          type: boolean
          description: Whether the search was successful
        intent:
          type: object
          description: Parsed user intent
          properties:
            products:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                    example: "Oracle Jet"
                  model:
                    type: string
                    example: "BES985"
            assetTypes:
              type: array
              items:
                type: string
              example: ["logo", "product_photo"]
            useCase:
              type: string
              example: "presentation"
            formats:
              type: array
              items:
                type: string
              example: ["PNG", "SVG"]
            originalRequest:
              type: string
              example: "Oracle Jet logo for my presentation"
        results:
          type: array
          items:
            $ref: '#/components/schemas/BrandAsset'
        suggestions:
          type: array
          items:
            $ref: '#/components/schemas/Suggestion'

    BrandAsset:
      type: object
      properties:
        id:
          type: string
          description: Unique asset identifier
        name:
          type: string
          description: Asset name
          example: "Oracle Jet Logo - Primary"
        url:
          type: string
          format: uri
          description: Direct download URL
        thumbnail:
          type: string
          format: uri
          description: Thumbnail preview URL
        format:
          type: string
          description: File format
          example: "PNG"
        size:
          type: string
          description: File size or dimensions
          example: "2048x1024"
        aiSummary:
          type: string
          description: AI-generated summary for context
          example: "Oracle Jet Logo - Primary in PNG format with transparency. Perfect for presentation use."
        downloadUrl:
          type: string
          format: uri
          description: Download URL
        usageNotes:
          type: array
          items:
            type: string
          description: Usage recommendations
          example: ["✅ PNG format ideal for presentations", "✅ High resolution, suitable for print"]

    Suggestion:
      type: object
      properties:
        type:
          type: string
          enum: [no_results, format_alternative, try_broader, try_specific, auth_required]
        message:
          type: string
          description: Helpful suggestion message
        action:
          type: string
          description: Recommended action

    Error:
      type: object
      properties:
        error:
          type: string
          description: Error code
        message:
          type: string
          description: Human-readable error message
        timestamp:
          type: string
          format: date-time

    AuthError:
      type: object
      properties:
        error:
          type: string
          example: "authentication_required"
        message:
          type: string
          example: "Please authenticate with Brandfolder to access assets"
        auth_url:
          type: string
          format: uri
          description: URL to start authentication flow

  securitySchemes:
    BrandfolderOAuth:
      type: oauth2
      description: OAuth2 authentication with Brandfolder
      flows:
        authorizationCode:
          authorizationUrl: https://oauth2.brandfolder-apps.com/oauth2/auth
          tokenUrl: https://oauth2.brandfolder-apps.com/oauth2/token
          scopes:
            openid: Access user identity
            offline: Offline access for refresh tokens

security:
  - BrandfolderOAuth: [openid, offline]
