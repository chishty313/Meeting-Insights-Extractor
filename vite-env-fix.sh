#!/bin/bash

# Vite Environment Variable Fix Script
# This script implements the proper Vite environment variable solution

set -e

echo "🔧 Vite Environment Variable Fix Script"
echo "========================================"

# Navigate to project directory
cd /var/www/meeting-insights-extractor

echo "📥 Pulling latest changes..."
git pull origin main

echo "🛑 Stopping PM2 process..."
pm2 stop meeting-insights-prod

echo "🔍 Step 1: Updating .env file with VITE_ prefix..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "📋 Current .env content:"
    cat .env
    echo ""
    
    # Check if already has VITE_ prefix
    if grep -q "VITE_AZURE_OPENAI_API_KEY" .env; then
        echo "✅ .env file already has VITE_ prefix"
    else
        echo "🔄 Adding VITE_ prefix to environment variables..."
        
        # Create backup
        cp .env .env.backup
        
        # Update .env file with VITE_ prefix
        sed -i 's/^AZURE_OPENAI_API_KEY=/VITE_AZURE_OPENAI_API_KEY=/' .env
        sed -i 's/^AZURE_OPENAI_ENDPOINT=/VITE_AZURE_OPENAI_ENDPOINT=/' .env
        sed -i 's/^GEMINI_API_KEY=/VITE_GEMINI_API_KEY=/' .env
        sed -i 's/^ZOOM_CLIENT_ID=/VITE_ZOOM_CLIENT_ID=/' .env
        sed -i 's/^ZOOM_CLIENT_SECRET=/VITE_ZOOM_CLIENT_SECRET=/' .env
        sed -i 's/^ZOOM_ACCOUNT_ID=/VITE_ZOOM_ACCOUNT_ID=/' .env
        
        echo "✅ Updated .env file with VITE_ prefix"
    fi
    
    echo "📋 Updated .env content:"
    cat .env
else
    echo "❌ .env file not found, creating it with VITE_ prefix..."
    cat > .env << 'EOF'
# Azure OpenAI Configuration (Required) - VITE_ prefix for client-side access
VITE_AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2025-01-01-preview

# Google Gemini Configuration (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Zoom API Configuration (Optional)
VITE_ZOOM_CLIENT_ID=your_zoom_client_id_here
VITE_ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
VITE_ZOOM_ACCOUNT_ID=your_zoom_account_id_here
EOF
    echo "⚠️  Please edit the .env file with your actual API keys:"
    echo "   nano .env"
    exit 1
fi

echo "🔍 Step 2: Verifying .env file has real values..."
if grep -q "your_azure_openai_api_key_here" .env; then
    echo "❌ .env file contains placeholder values!"
    echo "⚠️  Please edit the .env file with your actual API keys:"
    echo "   nano .env"
    exit 1
fi

echo "✅ .env file looks good"

echo "🔍 Step 3: Testing Vite environment variable loading..."
node -e "
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    if (value && !value.startsWith('#')) {
      envVars[key.trim()] = value;
    }
  }
});

console.log('📋 VITE_ prefixed environment variables:');
console.log('VITE_AZURE_OPENAI_API_KEY:', envVars.VITE_AZURE_OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('VITE_AZURE_OPENAI_ENDPOINT:', envVars.VITE_AZURE_OPENAI_ENDPOINT ? 'SET' : 'NOT SET');
console.log('VITE_GEMINI_API_KEY:', envVars.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET');

const isAzureConfigured = !!(envVars.VITE_AZURE_OPENAI_API_KEY && envVars.VITE_AZURE_OPENAI_ENDPOINT);
console.log('Azure Configuration Status:', isAzureConfigured ? 'CONFIGURED' : 'NOT CONFIGURED');

if (!isAzureConfigured) {
  console.log('❌ Azure configuration is missing!');
  process.exit(1);
}
"

echo "✅ Environment variables are properly configured"

echo "🔍 Step 4: Installing dependencies..."
npm install

echo "🏗️ Step 5: Rebuilding application with Vite environment variables..."
# Clear previous build
rm -rf dist

# Build with Vite environment variables
npm run build

echo "🔍 Step 6: Verifying Vite environment variables are in built files..."
if [ -d "dist" ]; then
    echo "✅ dist directory exists"
    echo "🔍 Searching for VITE_ environment variables in built files..."
    find dist -name "*.js" -exec grep -l "VITE_AZURE_OPENAI_API_KEY" {} \; | head -5
    echo "🔍 Checking if Vite environment variables are embedded..."
    if grep -r "VITE_AZURE_OPENAI_API_KEY" dist/ | head -3; then
        echo "✅ Vite environment variables found in built files"
    else
        echo "❌ Vite environment variables not found in built files"
        echo "🔍 Checking for any environment variable references..."
        grep -r "AZURE_OPENAI" dist/ | head -3 || echo "No Azure references found"
    fi
else
    echo "❌ dist directory not found - need to build first"
fi

echo "🔄 Step 7: Restarting PM2 process..."
pm2 restart meeting-insights-prod
pm2 save

echo "⏳ Waiting for application to start..."
sleep 5

echo "📊 Step 8: Checking PM2 status..."
pm2 status

echo "📋 Step 9: Recent logs:"
pm2 logs meeting-insights-prod --lines 10

echo "🌐 Step 10: Testing application..."
echo "🔍 Testing local access..."
if curl -s http://localhost:4173 | grep -i "azure configuration"; then
    echo "❌ Still showing Azure configuration error"
else
    echo "✅ No Azure configuration error found"
fi

echo "🔍 Testing external access..."
if curl -s https://assistant.niftyai.net | grep -i "azure configuration"; then
    echo "❌ Still showing Azure configuration error"
else
    echo "✅ No Azure configuration error found"
fi

echo ""
echo "✅ Vite environment variable fix completed!"
echo "🌐 Test your application at: https://assistant.niftyai.net"
echo "🔍 Check browser console for debug logs"
echo "📋 If still having issues, check PM2 logs: pm2 logs meeting-insights-prod"
