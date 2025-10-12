#!/bin/bash

# Fix Environment Variables Script for VM Deployment
# Run this script on your server to fix environment variable issues

set -e

echo "🔧 Fixing environment variables on server..."

# Navigate to project directory
cd /var/www/meeting-insights-extractor

echo "📥 Pulling latest changes..."
git pull origin main

echo "🔍 Checking current .env file..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "📋 Current .env content:"
    cat .env
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

echo "🔍 Checking environment variables in .env..."
if grep -q "your_azure_openai_api_key_here" .env; then
    echo "❌ .env file contains placeholder values!"
    echo "⚠️  Please edit the .env file with your actual API keys:"
    echo "   nano .env"
    exit 1
fi

echo "✅ .env file looks good"

echo "🔍 Checking if environment variables are loaded..."
node -e "
const fs = require('fs');
const path = require('path');

// Load .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

console.log('Environment variables from .env:');
console.log('AZURE_OPENAI_API_KEY:', envVars.AZURE_OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('AZURE_OPENAI_ENDPOINT:', envVars.AZURE_OPENAI_ENDPOINT ? 'SET' : 'NOT SET');
console.log('GEMINI_API_KEY:', envVars.GEMINI_API_KEY ? 'SET' : 'NOT SET');
"

echo "🏗️ Rebuilding application with environment variables..."
npm run build

echo "🔄 Restarting PM2 process..."
pm2 delete meeting-insights-prod || true
pm2 start ecosystem.config.cjs --env production
pm2 save

echo "📊 Checking PM2 status..."
pm2 status

echo "📋 Recent logs:"
pm2 logs meeting-insights-prod --lines 10

echo "✅ Environment variable fix completed!"
echo "🌐 Test your application at: https://assistant.niftyai.net"
echo "🔍 Check browser console for 'Azure Config Debug' logs"
