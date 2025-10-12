#!/bin/bash

# Meeting Insights Extractor - Server Setup Script
# Run this script on your server to set up the complete environment

set -e  # Exit on any error

echo "🖥️ Setting up Meeting Insights Extractor on server..."

# Create project directory
echo "📁 Creating project directory..."
sudo mkdir -p /var/www/meeting-insights-extractor
sudo chown -R nifty:nifty /var/www/meeting-insights-extractor
cd /var/www/meeting-insights-extractor

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/chishty313/Meeting-Insights-Extractor.git .

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file
echo "🔐 Creating .env file..."
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

echo "⚠️  IMPORTANT: Please edit the .env file with your actual API keys:"
echo "   nano .env"

# Create logs directory
echo "📋 Creating logs directory..."
mkdir -p logs

# Build application
echo "🏗️ Building application..."
npm run build

# Setup PM2
echo "⚙️ Setting up PM2..."
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup

echo "✅ Server setup completed!"
echo "🔧 Next steps:"
echo "1. Edit .env file with your API keys: nano .env"
echo "2. Restart PM2: pm2 restart meeting-insights-prod"
echo "3. Check status: pm2 status"
echo "4. View logs: pm2 logs meeting-insights-prod"
