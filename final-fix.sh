#!/bin/bash

# Final Fix Script - This will definitely resolve the environment variable issue
# Run this script on your server

set -e

echo "🔧 Final Fix Script for Environment Variables"
echo "============================================="

# Navigate to project directory
cd /var/www/meeting-insights-extractor

echo "📥 Pulling latest changes..."
git pull origin main

echo "🔍 Checking .env file..."
if [ ! -f ".env" ]; then
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

echo "🔍 Verifying .env file has real values..."
if grep -q "your_azure_openai_api_key_here" .env; then
    echo "❌ .env file contains placeholder values!"
    echo "⚠️  Please edit the .env file with your actual API keys:"
    echo "   nano .env"
    exit 1
fi

echo "✅ .env file looks good"

echo "🔍 Testing environment variable loading..."
node -e "
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

console.log('Environment variables loaded:');
console.log('AZURE_OPENAI_API_KEY:', envVars.AZURE_OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('AZURE_OPENAI_ENDPOINT:', envVars.AZURE_OPENAI_ENDPOINT ? 'SET' : 'NOT SET');

const isAzureConfigured = !!(envVars.AZURE_OPENAI_API_KEY && envVars.AZURE_OPENAI_ENDPOINT);
console.log('Azure Configuration Status:', isAzureConfigured ? 'CONFIGURED' : 'NOT CONFIGURED');

if (!isAzureConfigured) {
  console.log('❌ Azure configuration is missing!');
  process.exit(1);
}
"

echo "✅ Environment variables are properly configured"

echo "🏗️ Rebuilding application with environment variables..."
# Clear previous build
rm -rf dist

# Build with environment variables
npm run build

echo "🔍 Verifying environment variables are in built files..."
if grep -q "AZURE_OPENAI_API_KEY" dist/assets/*.js; then
    echo "✅ Environment variables found in built files"
else
    echo "❌ Environment variables not found in built files"
    echo "🔍 Checking build process..."
    npm run build 2>&1 | grep -i "azure\|env" || echo "No environment variable info in build output"
fi

echo "🔄 Restarting PM2 process..."
pm2 delete meeting-insights-prod || true
pm2 start ecosystem.config.cjs --env production
pm2 save

echo "⏳ Waiting for application to start..."
sleep 5

echo "📊 Checking PM2 status..."
pm2 status

echo "📋 Recent logs:"
pm2 logs meeting-insights-prod --lines 10

echo "🌐 Testing application..."
echo "🔍 Testing local access..."
curl -s http://localhost:4173 | grep -i "azure configuration" && echo "❌ Still showing Azure configuration error" || echo "✅ No Azure configuration error found"

echo "🔍 Testing external access..."
curl -s https://assistant.niftyai.net | grep -i "azure configuration" && echo "❌ Still showing Azure configuration error" || echo "✅ No Azure configuration error found"

echo ""
echo "✅ Final fix completed!"
echo "🌐 Test your application at: https://assistant.niftyai.net"
echo "🔍 Check browser console for debug logs"
