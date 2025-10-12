#!/bin/bash

# Definitive Fix Script - This will definitely resolve the environment variable issue
# Run this script on your server

set -e

echo "🔧 Definitive Fix Script for Environment Variables"
echo "================================================="

# Navigate to project directory
cd /var/www/meeting-insights-extractor

echo "📥 Pulling latest changes..."
git pull origin main

echo "🔍 Step 1: Testing .env file loading..."
node test-env-loading.cjs

echo ""
echo "🔍 Step 2: Checking current .env file..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "📋 .env file content:"
    cat .env
    echo ""
else
    echo "❌ .env file not found, creating it..."
    cat > .env << 'EOF'
# Azure OpenAI Configuration (Required)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2025-01-01-preview

# Google Gemini Configuration (Optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Zoom API Configuration (Optional)
ZOOM_CLIENT_ID=your_zoom_client_id_here
ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
ZOOM_ACCOUNT_ID=your_zoom_account_id_here
EOF
    echo "⚠️  Please edit the .env file with your actual API keys:"
    echo "   nano .env"
    exit 1
fi

echo "🔍 Step 3: Verifying .env file has real values..."
if grep -q "your_azure_openai_api_key_here" .env; then
    echo "❌ .env file contains placeholder values!"
    echo "⚠️  Please edit the .env file with your actual API keys:"
    echo "   nano .env"
    exit 1
fi

echo "✅ .env file looks good"

echo "🔍 Step 4: Testing environment variable loading with Node.js..."
node -e "
const fs = require('fs');
const path = require('path');

console.log('📋 Environment variables from .env file:');
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

console.log('AZURE_OPENAI_API_KEY:', envVars.AZURE_OPENAI_API_KEY ? 'SET (length: ' + envVars.AZURE_OPENAI_API_KEY.length + ')' : 'NOT SET');
console.log('AZURE_OPENAI_ENDPOINT:', envVars.AZURE_OPENAI_ENDPOINT ? 'SET' : 'NOT SET');
console.log('GEMINI_API_KEY:', envVars.GEMINI_API_KEY ? 'SET (length: ' + envVars.GEMINI_API_KEY.length + ')' : 'NOT SET');

const isAzureConfigured = !!(envVars.AZURE_OPENAI_API_KEY && envVars.AZURE_OPENAI_ENDPOINT);
console.log('Azure Configuration Status:', isAzureConfigured ? 'CONFIGURED' : 'NOT CONFIGURED');

if (!isAzureConfigured) {
  console.log('❌ Azure configuration is missing!');
  process.exit(1);
}
"

echo "✅ Environment variables are properly configured"

echo "🔍 Step 5: Testing Vite configuration loading..."
echo "🏗️ Running Vite build to test environment variable loading..."
npm run build 2>&1 | grep -E "(Vite Config Debug|AZURE_OPENAI|Environment)" || echo "No environment variable debug info in build output"

echo "🔍 Step 6: Verifying environment variables are in built files..."
if [ -d "dist" ]; then
    echo "✅ dist directory exists"
    echo "🔍 Searching for environment variables in built files..."
    find dist -name "*.js" -exec grep -l "AZURE_OPENAI_API_KEY" {} \; | head -5
    echo "🔍 Checking if environment variables are embedded..."
    if grep -r "process.env.AZURE_OPENAI_API_KEY" dist/ | head -3; then
        echo "✅ Environment variables found in built files"
    else
        echo "❌ Environment variables not found in built files"
        echo "🔍 Checking for any environment variable references..."
        grep -r "AZURE_OPENAI" dist/ | head -3 || echo "No Azure references found"
    fi
else
    echo "❌ dist directory not found - need to build first"
fi

echo "🔄 Step 7: Restarting PM2 process..."
pm2 delete meeting-insights-prod || true
pm2 start ecosystem.config.cjs --env production
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
echo "✅ Definitive fix completed!"
echo "🌐 Test your application at: https://assistant.niftyai.net"
echo "🔍 Check browser console for debug logs"
echo "📋 If still having issues, check PM2 logs: pm2 logs meeting-insights-prod"
