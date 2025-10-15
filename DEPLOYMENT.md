# 🚀 Meeting Insights Extractor - Deployment Guide

## 📋 Prerequisites

### Server Requirements

- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 20GB+ free space
- **Node.js**: v18+ (v20+ recommended)
- **PM2**: For process management
- **Nginx**: For reverse proxy
- **SSL Certificate**: Let's Encrypt (optional but recommended)

### Required Services

- **Azure OpenAI**: API key and endpoint
- **Google Gemini**: API key (optional)
- **Zoom API**: Client ID, Secret, Account ID (optional)
- **Pinecone**: API key and index details

## 🔧 Environment Variables Setup

### 1. Frontend Environment Variables (.env)

Create `.env` file in project root:

```bash
# Azure OpenAI Configuration
VITE_AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

# Google Gemini Configuration (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Zoom API Configuration (Optional)
VITE_ZOOM_CLIENT_ID=your_zoom_client_id_here
VITE_ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
VITE_ZOOM_ACCOUNT_ID=your_zoom_account_id_here

# Backend URL (for RAG pipeline)
VITE_BACKEND_URL=http://localhost:3001
```

### 2. Backend Environment Variables (backend/.env)

Create `backend/.env` file:

```bash
# Server Configuration
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000,http://localhost:3004,https://yourdomain.com

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-5
AZURE_OPENAI_CHAT_ENDPOINT=https://your-chat-resource.openai.azure.com
AZURE_OPENAI_CHAT_API_KEY=your_chat_api_key_here
AZURE_OPENAI_EMBEDDINGS_ENDPOINT=https://your-embeddings-resource.openai.azure.com
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-3-large
AZURE_OPENAI_EMBEDDINGS_API_KEY=your_embeddings_api_key_here
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=meeting-context-index
PINECONE_INDEX_HOST=https://meeting-context-index-u4m7ylo.svc.aped-4627-b74a.pinecone.io
PINECONE_INDEX_DIM=1024

# Google Gemini Configuration (Optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Zoom API Configuration (Optional)
ZOOM_CLIENT_ID=your_zoom_client_id_here
ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
ZOOM_ACCOUNT_ID=your_zoom_account_id_here
```

## 🐙 GitHub Repository Setup

### 1. Initialize Git Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Meeting Insights Extractor with RAG pipeline"

# Add remote origin (replace with your GitHub repository URL)
git remote add origin https://github.com/yourusername/meeting-insights-extractor.git

# Push to GitHub
git push -u origin main
```

### 2. Create .gitignore

```bash
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
backend/.env

# Build outputs
dist/
build/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Temporary files
tmp/
temp/
```

## 🖥️ Server Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

### 2. Clone and Setup Project

```bash
# Clone repository
git clone https://github.com/yourusername/meeting-insights-extractor.git
cd meeting-insights-extractor

# Install dependencies
npm install

# Create environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Edit environment variables
nano .env
nano backend/.env
```

### 3. Build and Start Services

```bash
# Build frontend
npm run build

# Start backend with PM2
pm2 start backend/server.ts --name "meeting-insights-backend" --interpreter tsx

# Start frontend with PM2
pm2 start "npm run preview" --name "meeting-insights-frontend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/meeting-insights`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
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

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/meeting-insights /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔧 Environment Variable Troubleshooting

### Common Issues and Solutions

#### 1. "Azure Configuration Required" Error

**Problem**: Frontend can't access environment variables
**Solution**:

```bash
# Ensure .env file exists in project root
ls -la .env

# Check if variables are prefixed with VITE_
grep "VITE_" .env

# Rebuild frontend after changing .env
npm run build
```

#### 2. Backend Environment Variables Not Loading

**Problem**: Backend can't access environment variables
**Solution**:

```bash
# Check backend/.env file
ls -la backend/.env

# Verify dotenv is loading correctly
node -e "require('dotenv').config({path: './backend/.env'}); console.log(process.env.AZURE_OPENAI_API_KEY)"
```

#### 3. CORS Issues

**Problem**: Frontend can't connect to backend
**Solution**:

```bash
# Update FRONTEND_ORIGIN in backend/.env
echo "FRONTEND_ORIGIN=http://localhost:3000,http://localhost:3004,https://yourdomain.com" >> backend/.env

# Restart backend
pm2 restart meeting-insights-backend
```

#### 4. Pinecone Connection Issues

**Problem**: Vector dimension mismatch
**Solution**:

```bash
# Check Pinecone configuration
grep "PINECONE_INDEX_DIM" backend/.env

# Ensure dimension matches your Pinecone index
echo "PINECONE_INDEX_DIM=1024" >> backend/.env
```

## 📊 Monitoring and Maintenance

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs meeting-insights-backend
pm2 logs meeting-insights-frontend

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Delete services
pm2 delete all
```

### Health Checks

```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
curl http://localhost:4173

# Check Nginx
sudo systemctl status nginx
```

## 🚨 Troubleshooting Checklist

1. **Environment Variables**:

   - [ ] `.env` file exists in project root
   - [ ] `backend/.env` file exists
   - [ ] All required variables are set
   - [ ] Variables are properly prefixed (VITE\_ for frontend)

2. **Services Running**:

   - [ ] PM2 processes are running
   - [ ] Nginx is running
   - [ ] Ports 3001 and 4173 are accessible

3. **Network**:

   - [ ] Firewall allows HTTP/HTTPS traffic
   - [ ] Domain points to server IP
   - [ ] SSL certificate is valid (if using HTTPS)

4. **Dependencies**:
   - [ ] Node.js version is 18+
   - [ ] All npm packages are installed
   - [ ] Build completed successfully

## 📞 Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables are loaded
4. Ensure all services are running
5. Check network connectivity

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild frontend
npm run build

# Restart services
pm2 restart all
```

### Backup Strategy

```bash
# Backup environment files
cp .env .env.backup
cp backend/.env backend/.env.backup

# Backup PM2 configuration
pm2 save
```

This deployment guide should help you successfully deploy the Meeting Insights Extractor with proper environment variable handling and avoid the issues we encountered previously.
