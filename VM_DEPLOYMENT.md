# 🖥️ VM Deployment Guide

## 🚀 Deploying to Your Own VM

This guide will help you deploy the Meeting Insights Extractor to your own virtual machine.

### 📋 Prerequisites

- **Node.js 18+** installed on your VM
- **Git** installed on your VM
- **Nginx** or **Apache** (for serving the built application)
- **PM2** (recommended for process management)

### 🔧 Step 1: Clone and Setup

```bash
# SSH into your VM
ssh your-username@your-vm-ip

# Clone the repository
git clone https://github.com/chishty313/Meeting-Insights-Extractor.git
cd Meeting-Insights-Extractor

# Install dependencies
npm install
```

### 🔐 Step 2: Set Up Environment Variables

#### Option A: Using .env file (Recommended)

```bash
# Create .env file in project root
nano .env
```

Add your environment variables:

```env
# Azure OpenAI (Required)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2025-01-01-preview

# Google Gemini (Optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Zoom API (Optional)
ZOOM_CLIENT_ID=your_zoom_client_id_here
ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
ZOOM_ACCOUNT_ID=your_zoom_account_id_here
```

#### Option B: Using System Environment Variables

```bash
# Add to your shell profile (~/.bashrc or ~/.zshrc)
export AZURE_OPENAI_API_KEY="your_azure_openai_api_key_here"
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2025-01-01-preview"
export GEMINI_API_KEY="your_gemini_api_key_here"
export ZOOM_CLIENT_ID="your_zoom_client_id_here"
export ZOOM_CLIENT_SECRET="your_zoom_client_secret_here"
export ZOOM_ACCOUNT_ID="your_zoom_account_id_here"

# Reload your shell
source ~/.bashrc
```

### 🏗️ Step 3: Build the Application

```bash
# Build the application for production
npm run build

# This creates a 'dist' folder with all the static files
```

### 🌐 Step 4: Serve the Application

#### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Install serve globally
npm install -g serve

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'meeting-insights-extractor',
    script: 'serve',
    args: '-s dist -l 3000',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Option B: Using Nginx

```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/meeting-insights-extractor
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    root /path/to/Meeting-Insights-Extractor/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Handle API routes if needed
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/meeting-insights-extractor /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Option C: Using Apache

```bash
# Install Apache
sudo apt install apache2

# Enable required modules
sudo a2enmod rewrite
sudo a2enmod headers

# Create Apache configuration
sudo nano /etc/apache2/sites-available/meeting-insights-extractor.conf
```

Add this configuration:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/Meeting-Insights-Extractor/dist

    <Directory /path/to/Meeting-Insights-Extractor/dist>
        AllowOverride All
        Require all granted
    </Directory>

    # Handle SPA routing
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</VirtualHost>
```

Enable the site:

```bash
# Enable the site
sudo a2ensite meeting-insights-extractor.conf

# Restart Apache
sudo systemctl restart apache2
```

### 🔒 Step 5: SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Or for Apache
sudo certbot --apache -d your-domain.com
```

### 🔄 Step 6: Auto-Deploy Script (Optional)

Create a deployment script:

```bash
# Create deploy script
nano deploy.sh
```

Add this content:

```bash
#!/bin/bash

# Navigate to project directory
cd /path/to/Meeting-Insights-Extractor

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build the application
npm run build

# Restart PM2 process
pm2 restart meeting-insights-extractor

echo "Deployment completed successfully!"
```

Make it executable:

```bash
chmod +x deploy.sh
```

### 🧪 Step 7: Test Your Deployment

```bash
# Check if the application is running
pm2 status

# Check logs
pm2 logs meeting-insights-extractor

# Test the application
curl http://localhost:3000
```

### 🔍 Troubleshooting

#### Issue: "Azure Configuration Required" Error

**Check environment variables:**

```bash
# Verify .env file exists and has correct values
cat .env

# Check if variables are loaded
node -e "console.log(process.env.AZURE_OPENAI_API_KEY)"
```

**Solution:**

```bash
# Make sure .env file is in project root
ls -la .env

# Check file permissions
chmod 644 .env

# Restart the application
pm2 restart meeting-insights-extractor
```

#### Issue: Build Failures

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

#### Issue: Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use a different port
pm2 start ecosystem.config.js --update-env
```

### 📊 Monitoring

#### Check Application Status:

```bash
# PM2 status
pm2 status

# PM2 logs
pm2 logs meeting-insights-extractor

# System resources
pm2 monit
```

#### Check Nginx/Apache:

```bash
# Nginx status
sudo systemctl status nginx

# Apache status
sudo systemctl status apache2

# Check logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/apache2/error.log
```

### 🎯 Success Indicators

Your deployment is successful when:

- ✅ Application starts without errors
- ✅ No "Azure Configuration Required" message
- ✅ All three modes (Audio, Transcript, Zoom) are visible
- ✅ File upload works without errors
- ✅ Processing completes successfully

### 🔄 Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart application
pm2 restart meeting-insights-extractor
```

### 🆘 Need Help?

If you encounter issues:

1. **Check PM2 logs**: `pm2 logs meeting-insights-extractor`
2. **Verify environment variables**: `cat .env`
3. **Test locally**: `npm run dev`
4. **Check system resources**: `pm2 monit`
