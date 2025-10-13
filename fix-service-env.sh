#!/bin/bash

# Fix Service Environment Variables Script
# This script updates the service files to use VITE_ prefixed environment variables

set -e

echo "🔧 Fixing Service Environment Variables"
echo "======================================"

# Navigate to project directory
cd /var/www/meeting-insights-extractor

echo "📥 Pulling latest changes..."
git pull origin main

echo "🛑 Stopping PM2 process..."
pm2 stop meeting-insights-prod

echo "🔍 Step 1: Verifying .env file has VITE_ prefix..."
if grep -q "VITE_AZURE_OPENAI_API_KEY" .env; then
    echo "✅ .env file has VITE_ prefix"
else
    echo "❌ .env file missing VITE_ prefix, running vite-env-fix.sh first..."
    chmod +x vite-env-fix.sh
    ./vite-env-fix.sh
    exit 0
fi

echo "🔍 Step 2: Verifying .env file has real values..."
if grep -q "your_azure_openai_api_key_here" .env; then
    echo "❌ .env file contains placeholder values!"
    echo "⚠️  Please edit the .env file with your actual API keys:"
    echo "   nano .env"
    exit 1
fi

echo "✅ .env file looks good"

echo "🔍 Step 3: Testing environment variable loading..."
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
console.log('VITE_ZOOM_CLIENT_ID:', envVars.VITE_ZOOM_CLIENT_ID ? 'SET' : 'NOT SET');

const isAzureConfigured = !!(envVars.VITE_AZURE_OPENAI_API_KEY && envVars.VITE_AZURE_OPENAI_ENDPOINT);
console.log('Azure Configuration Status:', isAzureConfigured ? 'CONFIGURED' : 'NOT CONFIGURED');

if (!isAzureConfigured) {
  console.log('❌ Azure configuration is missing!');
  process.exit(1);
}
"

echo "✅ Environment variables are properly configured"

echo "🏗️ Step 4: Rebuilding application with updated service files..."
# Clear previous build
rm -rf dist

# Build with updated service files
npm run build

echo "🔍 Step 5: Verifying environment variables are in built files..."
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

echo "🔄 Step 6: Restarting PM2 process..."
pm2 restart meeting-insights-prod
pm2 save

echo "⏳ Waiting for application to start..."
sleep 5

echo "📊 Step 7: Checking PM2 status..."
pm2 status

echo "📋 Step 8: Recent logs:"
pm2 logs meeting-insights-prod --lines 10

echo "🌐 Step 9: Testing application..."
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
echo "✅ Service environment variable fix completed!"
echo "🌐 Test your application at: https://assistant.niftyai.net"
echo "🔍 Check browser console for debug logs"
echo "📋 If still having issues, check PM2 logs: pm2 logs meeting-insights-prod"
