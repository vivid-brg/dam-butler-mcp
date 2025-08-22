
Content is user-generated and unverified.
#!/bin/bash

# 🚀 DAM Butler MCP Deployment Script
# This script handles complete deployment to Vercel with environment setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis for better UX
ROCKET="🚀"
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
INFO="💡"
GEAR="⚙️"
SPARKLES="✨"
SKU="🏷️"

echo -e "${CYAN}${ROCKET} DAM Butler MCP Deployment${NC}"
echo -e "${CYAN}=================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}${ERROR} Error: package.json not found. Are you in the project directory?${NC}"
    exit 1
fi

PROJECT_NAME=$(node -p "require('./package.json').name")
PROJECT_VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}📂 Project: ${PROJECT_NAME} v${PROJECT_VERSION}${NC}"
echo -e "${BLUE}📍 Directory: $(pwd)${NC}"
echo ""

# Pre-deployment checks
echo -e "${PURPLE}${GEAR} Pre-Deployment Checks${NC}"
echo -e "${PURPLE}========================${NC}"

# Check Node.js version
NODE_VERSION=$(node --version)
echo -e "${CHECK} Node.js version: ${NODE_VERSION}"

# Check if required files exist
REQUIRED_FILES=("src/server.js" "api/mcp.js" "package.json" "vercel.json")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${CHECK} Found: $file"
    else
        echo -e "${ERROR} Missing: $file"
        MISSING_FILES+=("$file")
    fi
done

# Check for recommended files
RECOMMENDED_FILES=("config/breville-config.json" "README.md" ".gitignore" "api/auth-callback.js")
for file in "${RECOMMENDED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${CHECK} Found: $file"
    else
        echo -e "${WARNING} Recommended: $file (missing)"
    fi
done

# Special check for breville-config.json SKU data
if [ -f "config/breville-config.json" ]; then
    SKU_COUNT=$(grep -o '"sku":' config/breville-config.json | wc -l | tr -d ' ')
    COLOR_COUNT=$(grep -o '"color_code":' config/breville-config.json | wc -l | tr -d ' ')
    echo -e "${SKU} SKU data: ${SKU_COUNT} SKUs, ${COLOR_COUNT} color codes"
else
    echo -e "${ERROR} Missing config/breville-config.json - your MCP will have limited intelligence"
fi

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    echo -e "${RED}${ERROR} Cannot deploy with missing required files: ${MISSING_FILES[*]}${NC}"
    exit 1
fi

echo ""

# Security check for .env file
if [ -f ".env" ]; then
    echo -e "${YELLOW}${WARNING} WARNING: .env file detected in project root${NC}"
    echo -e "${YELLOW}This file should NOT be committed to GitHub!${NC}"
    
    read -p "$(echo -e ${YELLOW}Do you want to remove .env from git tracking? [y/N]: ${NC})" remove_env
    if [[ $remove_env =~ ^[Yy]$ ]]; then
        git rm --cached .env 2>/dev/null || echo "(.env not in git)"
        echo -e "${CHECK} .env removed from git tracking"
        echo -e "${INFO} Remember to regenerate your OpenAI API key!"
    fi
    echo ""
fi

# Check Vercel CLI
echo -e "${PURPLE}${GEAR} Vercel Setup${NC}"
echo -e "${PURPLE}==============${NC}"

if ! command -v vercel &> /dev/null; then
    echo -e "${INFO} Installing Vercel CLI..."
    npm install -g vercel
else
    VERCEL_VERSION=$(vercel --version)
    echo -e "${CHECK} Vercel CLI: v${VERCEL_VERSION}"
fi

# Check if logged into Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${INFO} Please log into Vercel..."
    vercel login
fi

VERCEL_USER=$(vercel whoami)
echo -e "${CHECK} Logged in as: ${VERCEL_USER}"
echo ""

# Environment Variables Setup
echo -e "${PURPLE}${GEAR} Environment Variables${NC}"
echo -e "${PURPLE}======================${NC}"

echo -e "${INFO} Required environment variables for production:"
echo "  BRANDFOLDER_CLIENT_ID     - Brandfolder OAuth client ID"
echo "  BRANDFOLDER_CLIENT_SECRET - Brandfolder OAuth secret"  
echo "  OPENAI_API_KEY           - OpenAI API key (recommended for smart intent parsing)"
echo ""

# Check current environment variables
echo -e "${INFO} Checking current Vercel environment variables..."
EXISTING_VARS=$(vercel env ls 2>/dev/null | grep -E "(BRANDFOLDER_CLIENT_ID|BRANDFOLDER_CLIENT_SECRET|OPENAI_API_KEY)" || echo "No relevant environment variables found")
echo "$EXISTING_VARS"
echo ""

# Interactive environment setup
read -p "$(echo -e ${BLUE}Do you want to add/update environment variables? [y/N]: ${NC})" setup_env

if [[ $setup_env =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${INFO} Setting up environment variables..."
    
    # Brandfolder Client ID
    read -p "Enter BRANDFOLDER_CLIENT_ID (or press Enter to skip): " client_id
    if [ ! -z "$client_id" ]; then
        echo "$client_id" | vercel env add BRANDFOLDER_CLIENT_ID production
        echo "$client_id" | vercel env add BRANDFOLDER_CLIENT_ID preview
        echo -e "${CHECK} BRANDFOLDER_CLIENT_ID configured"
    fi
    
    # Brandfolder Client Secret
    read -s -p "Enter BRANDFOLDER_CLIENT_SECRET (or press Enter to skip): " client_secret
    echo ""
    if [ ! -z "$client_secret" ]; then
        echo "$client_secret" | vercel env add BRANDFOLDER_CLIENT_SECRET production
        echo "$client_secret" | vercel env add BRANDFOLDER_CLIENT_SECRET preview
        echo -e "${CHECK} BRANDFOLDER_CLIENT_SECRET configured"
    fi
    
    # OpenAI API Key
    read -s -p "Enter OPENAI_API_KEY (or press Enter to skip): " openai_key
    echo ""
    if [ ! -z "$openai_key" ]; then
        echo "$openai_key" | vercel env add OPENAI_API_KEY production
        echo "$openai_key" | vercel env add OPENAI_API_KEY preview
        echo -e "${CHECK} OPENAI_API_KEY configured"
    fi
    
    # Set default values
    echo "https://thevault.work/breville" | vercel env add VAULT_BASE_URL production
    echo "https://api.brandfolder.com/v4" | vercel env add VAULT_API_BASE production
    echo "production" | vercel env add NODE_ENV production
    
    echo -e "${CHECK} Default environment variables configured"
fi

echo ""

# Local testing (optional)
read -p "$(echo -e ${BLUE}Do you want to run local tests before deploying? [Y/n]: ${NC})" run_tests

if [[ ! $run_tests =~ ^[Nn]$ ]]; then
    echo ""
    echo -e "${PURPLE}${GEAR} Running Local Tests${NC}"
    echo -e "${PURPLE}===================${NC}"
    
    if [ -f "test-mcp.js" ]; then
        echo -e "${INFO} Running DAM Butler MCP functionality tests..."
        if node test-mcp.js; then
            echo -e "${CHECK} Local tests passed!"
        else
            echo -e "${WARNING} Some tests failed, but continuing with deployment..."
            read -p "$(echo -e ${YELLOW}Continue anyway? [y/N]: ${NC})" continue_deploy
            if [[ ! $continue_deploy =~ ^[Yy]$ ]]; then
                echo -e "${ERROR} Deployment cancelled"
                exit 1
            fi
        fi
    else
        echo -e "${WARNING} test-mcp.js not found, skipping local tests"
        echo -e "${INFO} You can create this file to test your MCP functionality"
    fi
    echo ""
fi

# Deploy to Vercel
echo -e "${PURPLE}${ROCKET} Deploying to Vercel${NC}"
echo -e "${PURPLE}====================${NC}"

echo -e "${INFO} Starting deployment..."

# Deploy with production flag
if vercel --prod --yes; then
    echo -e "${GREEN}${SPARKLES} Deployment successful!${NC}"
else
    echo -e "${RED}${ERROR} Deployment failed!${NC}"
    echo -e "${INFO} Check the error messages above and try again"
    exit 1
fi

echo ""

# Get deployment information
echo -e "${PURPLE}${INFO} Getting deployment information...${NC}"

# Get the deployment URL
DEPLOYMENT_URL=$(vercel ls --scope $(vercel whoami) | grep "${PROJECT_NAME}" | head -1 | awk '{print $2}' | sed 's/https:\/\///')

if [ ! -z "$DEPLOYMENT_URL" ]; then
    echo ""
    echo -e "${GREEN}${SPARKLES} Deployment Complete!${NC}"
    echo -e "${GREEN}========================${NC}"
    echo ""
    echo -e "${CYAN}🌐 Your DAM Butler MCP is live at:${NC}"
    echo -e "${CYAN}   https://${DEPLOYMENT_URL}${NC}"
    echo ""
    echo -e "${CYAN}📚 API Endpoints:${NC}"
    echo -e "${CYAN}   MCP Server:     https://${DEPLOYMENT_URL}/mcp${NC}"
    echo -e "${CYAN}   Health Check:   https://${DEPLOYMENT_URL}/health${NC}"
    echo -e "${CYAN}   OAuth Callback: https://${DEPLOYMENT_URL}/auth/callback${NC}"
    echo -e "${CYAN}   API Schema:     https://${DEPLOYMENT_URL}/api/schema${NC}"
    echo ""
    
    # Test the deployment
    echo -e "${PURPLE}${GEAR} Testing Deployment${NC}"
    echo -e "${PURPLE}==================${NC}"
    
    echo -e "${INFO} Testing health endpoint..."
    if curl -s -f "https://${DEPLOYMENT_URL}/health" > /dev/null; then
        echo -e "${CHECK} Health endpoint responding"
    else
        echo -e "${WARNING} Health endpoint not responding (may take a moment to initialize)"
    fi
    
    echo -e "${INFO} Testing MCP endpoint..."
    if curl -s -f "https://${DEPLOYMENT_URL}/mcp" > /dev/null; then
        echo -e "${CHECK} MCP endpoint responding"
    else
        echo -e "${WARNING} MCP endpoint not responding (may take a moment to initialize)"
    fi
    
    echo ""
    echo -e "${CYAN}🎯 ChatGPT Enterprise Setup${NC}"
    echo -e "${CYAN}===========================${NC}"
    echo -e "1. ${CHECK} Open ChatGPT Enterprise"
    echo -e "2. ${CHECK} Create/edit your 'DAM Butler' Custom GPT"
    echo -e "3. ${CHECK} Set MCP Endpoint: ${BLUE}https://${DEPLOYMENT_URL}/mcp${NC}"
    echo -e "4. ${CHECK} Add these system instructions:"
    echo ""
    echo -e "${BLUE}You are the DAM Butler, an AI assistant that helps Breville team members find digital assets from The Vault.${NC}"
    echo -e "${BLUE}You understand Breville products, SKU patterns, regional branding, and asset types.${NC}"
    echo -e "${BLUE}Use the find_vault_assets tool for all searches. Be helpful and conversational.${NC}"
    echo ""
    
    echo -e "${CYAN}🧪 Test Queries for ChatGPT Enterprise:${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo -e "   ${BLUE}\"Find Oracle Jet logo for my presentation\"${NC}"
    echo -e "   ${BLUE}\"Get BES985BSS1BNA1 product photos\"${NC}"
    echo -e "   ${BLUE}\"Show me Sage Oracle Jet assets for UK market\"${NC}"
    echo -e "   ${BLUE}\"Find BOV860NRE1BNA1 lifestyle shots\"${NC}"
    echo -e "   ${BLUE}\"Get Oracle Dual Boiler in Black Truffle for social media\"${NC}"
    echo ""
    
    # SKU Intelligence status
    if [ -f "config/breville-config.json" ]; then
        SKU_COUNT=$(grep -o '"sku":' config/breville-config.json | wc -l | tr -d ' ')
        echo -e "${SKU} ${CHECK} SKU Intelligence: ${SKU_COUNT} SKUs configured"
        echo -e "   ${BLUE}Your MCP understands patterns like BES985BSS1BNA1, SES985BSS4GUK1${NC}"
    else
        echo -e "${SKU} ${WARNING} SKU Intelligence: Not configured (add config/breville-config.json)"
    fi
    
    # OAuth status check
    if [ -z "$client_id" ] || [ -z "$client_secret" ]; then
        echo ""
        echo -e "${YELLOW}${WARNING} Brandfolder OAuth not configured yet${NC}"
        echo -e "${YELLOW}   Your MCP will work with mock results until OAuth is set up${NC}"
        echo -e "${YELLOW}   When Brandfolder provides credentials:${NC}"
        echo -e "${YELLOW}   1. Add them to Vercel environment variables${NC}"
        echo -e "${YELLOW}   2. Update redirect URI: https://${DEPLOYMENT_URL}/auth/callback${NC}"
        echo ""
    else
        echo ""
        echo -e "${CHECK} ${GREEN} Brandfolder OAuth configured${NC}"
        echo -e "${INFO} Remember to update your Brandfolder OAuth app with:"
        echo -e "${BLUE}   Redirect URI: https://${DEPLOYMENT_URL}/auth/callback${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}📖 Resources:${NC}"
    echo -e "${CYAN}=============${NC}"
    echo -e "   Repository: https://github.com/$(git config --get remote.origin.url | sed 's/.*:///' | sed 's/.git$//' 2>/dev/null || echo 'your-repo')"
    echo -e "   Vercel Dashboard: https://vercel.com/dashboard"
    echo -e "   Health Check: https://${DEPLOYMENT_URL}/health"
    echo ""
    
else
    echo -e "${YELLOW}${WARNING} Could not retrieve deployment URL${NC}"
    echo -e "${INFO} Check your Vercel dashboard for deployment details${NC}"
    echo -e "${INFO} Visit: https://vercel.com/dashboard"
fi

echo ""
echo -e "${GREEN}${SPARKLES} Happy asset hunting! ${SPARKLES}${NC}"
echo ""
echo -e "${CYAN}💡 Pro Tips:${NC}"
echo -e "${CYAN}============${NC}"
echo -e "• Test SKU recognition: \"Find BES985BSS1BNA1 product photos\""
echo -e "• Use color names: \"Oracle Jet in Black Truffle\""
echo -e "• Specify use case: \"for my presentation\", \"for social media\""
echo -e "• Regional awareness: \"Sage products for UK market\""
echo ""

# Show configuration summary
if [ -f "config/breville-config.json" ]; then
    echo -e "${INFO} Your DAM Butler is configured with:"
    echo -e "   • SKU pattern recognition (BES/SES codes)"
    echo -e "   • Regional brand intelligence (Breville/Sage)"
    echo -e "   • Color code understanding (BSS, BTR, NRE, etc.)"
    echo -e "   • Intent-based search parsing"
    echo -e "   • Multi-product support (Espresso, Ovens, Blenders)"
fi
