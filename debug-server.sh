#!/bin/bash

# Comprehensive Server Debug Script
# This script will help debug environment variable issues on your server

set -e

echo "🔍 Comprehensive Server Debug Script"
echo "=================================="

# Navigate to project directory
cd /var/www/meeting-insights-extractor

echo "📁 Current directory: $(pwd)"
echo ""

echo "🔍 1. Checking .env file..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "📋 .env file content:"
    cat .env
    echo ""
else
    echo "❌ .env file not found!"
    exit 1
fi

echo "🔍 2. Testing environment variable loading with Node.js..."
node -e "
const fs = require('fs');
const path = require('path');

console.log('📋 Environment variables from .env file:');
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

console.log('AZURE_OPENAI_API_KEY:', envVars.AZURE_OPENAI_API_KEY ? 'SET (length: ' + envVars.AZURE_OPENAI_API_KEY.length + ')' : 'NOT SET');
console.log('AZURE_OPENAI_ENDPOINT:', envVars.AZURE_OPENAI_ENDPOINT ? 'SET' : 'NOT SET');
console.log('GEMINI_API_KEY:', envVars.GEMINI_API_KEY ? 'SET (length: ' + envVars.GEMINI_API_KEY.length + ')' : 'NOT SET');

const isAzureConfigured = !!(envVars.AZURE_OPENAI_API_KEY && envVars.AZURE_OPENAI_ENDPOINT);
console.log('Azure Configuration Status:', isAzureConfigured ? 'CONFIGURED' : 'NOT CONFIGURED');
"

echo ""
echo "🔍 3. Checking if environment variables are in built files..."
if [ -d "dist" ]; then
    echo "✅ dist directory exists"
    echo "🔍 Searching for environment variables in built files..."
    find dist -name "*.js" -exec grep -l "AZURE_OPENAI_API_KEY" {} \; | head -5
    echo "🔍 Checking if environment variables are embedded..."
    grep -r "process.env.AZURE_OPENAI_API_KEY" dist/ | head -3 || echo "❌ Environment variables not found in built files"
else
    echo "❌ dist directory not found - need to build first"
fi

echo ""
echo "🔍 4. Checking PM2 status..."
pm2 status

echo ""
echo "🔍 5. Checking PM2 logs..."
echo "📋 Recent PM2 logs:"
pm2 logs meeting-insights-prod --lines 10

echo ""
echo "🔍 6. Testing the application endpoint..."
echo "🌐 Testing application at localhost:4173..."
curl -s http://localhost:4173 | grep -i "azure configuration" || echo "✅ No Azure configuration error found in HTML"

echo ""
echo "🔍 7. Checking if the application is accessible..."
echo "🌐 Testing external access..."
curl -s https://assistant.niftyai.net | grep -i "azure configuration" || echo "✅ No Azure configuration error found in external access"

echo ""
echo "🔍 8. Checking Nginx configuration..."
echo "📋 Nginx status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "🔍 9. Checking if environment variables are loaded in PM2 process..."
pm2 show meeting-insights-prod

echo ""
echo "✅ Debug complete! Check the output above for any issues."
