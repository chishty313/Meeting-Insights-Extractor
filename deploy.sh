#!/bin/bash

# Meeting Insights Extractor - Production Deployment Script
# Run this script on your server to deploy updates

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Navigate to project directory
cd /var/www/meeting-insights-extractor

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building application for production..."
npm run build

echo "🔄 Restarting PM2 process..."
pm2 restart meeting-insights-prod

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at: https://assistant.niftyai.net"

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status

# Show recent logs
echo "📋 Recent logs:"
pm2 logs meeting-insights-prod --lines 10
