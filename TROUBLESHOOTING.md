# 🔧 Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Environment Variable Issues

#### Problem: "Azure Configuration Required" Error

**Symptoms:**

- Frontend shows "Azure Configuration Required"
- Console shows "API Key: NOT SET"
- Environment variables not loading

**Solutions:**

```bash
# 1. Check if .env file exists
ls -la .env

# 2. Verify environment variables are prefixed with VITE_
grep "VITE_" .env

# 3. Check if variables are properly formatted (no spaces around =)
cat .env

# 4. Rebuild frontend after changing .env
npm run build

# 5. Check if variables are accessible in browser
# Open browser console and type:
# console.log(import.meta.env.VITE_AZURE_OPENAI_API_KEY)
```

**Expected .env format:**

```bash
VITE_AZURE_OPENAI_API_KEY=your_key_here
VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
```

#### Problem: Backend Environment Variables Not Loading

**Symptoms:**

- Backend can't access environment variables
- "process.env is undefined" errors
- API calls failing

**Solutions:**

```bash
# 1. Check backend/.env file exists
ls -la backend/.env

# 2. Verify dotenv is loading correctly
node -e "require('dotenv').config({path: './backend/.env'}); console.log(process.env.AZURE_OPENAI_API_KEY)"

# 3. Check if backend/.env has correct format
cat backend/.env

# 4. Restart backend service
pm2 restart meeting-insights-backend
```

### 2. CORS Issues

#### Problem: CORS Policy Errors

**Symptoms:**

- "Access to fetch blocked by CORS policy"
- Frontend can't connect to backend
- Network errors in browser console

**Solutions:**

```bash
# 1. Update FRONTEND_ORIGIN in backend/.env
echo "FRONTEND_ORIGIN=http://localhost:3000,http://localhost:3004,https://yourdomain.com" >> backend/.env

# 2. Restart backend
pm2 restart meeting-insights-backend

# 3. Check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx

# 4. Verify backend is running
curl http://localhost:3001/health
```

### 3. Pinecone Connection Issues

#### Problem: Vector Dimension Mismatch

**Symptoms:**

- "Vector dimension 384 does not match the dimension of the index 1024"
- Embeddings not storing
- Pinecone upsert failures

**Solutions:**

```bash
# 1. Check Pinecone index dimension
grep "PINECONE_INDEX_DIM" backend/.env

# 2. Set correct dimension (usually 1024)
echo "PINECONE_INDEX_DIM=1024" >> backend/.env

# 3. Restart backend
pm2 restart meeting-insights-backend

# 4. Check Pinecone API key
grep "PINECONE_API_KEY" backend/.env
```

#### Problem: Pinecone API Key Issues

**Symptoms:**

- "PineconeConfigurationError: The client configuration must have required property: apiKey"
- Pinecone connection failures

**Solutions:**

```bash
# 1. Verify Pinecone API key is set
grep "PINECONE_API_KEY" backend/.env

# 2. Test Pinecone connection
node -e "
const { Pinecone } = require('@pinecone-database/pinecone');
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
console.log('Pinecone client created successfully');
"

# 3. Check Pinecone index host
grep "PINECONE_INDEX_HOST" backend/.env
```

### 4. Service Management Issues

#### Problem: PM2 Services Not Starting

**Symptoms:**

- Services not running
- "pm2: command not found"
- Services crashing

**Solutions:**

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Check PM2 status
pm2 status

# 3. Start services manually
pm2 start backend/server.ts --name "meeting-insights-backend" --interpreter tsx
pm2 start "npm run preview" --name "meeting-insights-frontend"

# 4. Check logs
pm2 logs meeting-insights-backend
pm2 logs meeting-insights-frontend

# 5. Restart all services
pm2 restart all
```

#### Problem: Port Already in Use

**Symptoms:**

- "Error: listen EADDRINUSE: address already in use :::3001"
- Services can't start

**Solutions:**

```bash
# 1. Find process using port 3001
lsof -i :3001

# 2. Kill the process
kill -9 <PID>

# 3. Or kill all Node.js processes
pkill -f node

# 4. Restart services
pm2 restart all
```

### 5. Build and Deployment Issues

#### Problem: Build Failures

**Symptoms:**

- "npm run build" fails
- TypeScript errors
- Missing dependencies

**Solutions:**

```bash
# 1. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Check TypeScript errors
npx tsc --noEmit

# 3. Fix linting errors
npm run lint

# 4. Build with verbose output
npm run build -- --verbose
```

#### Problem: Frontend Not Loading

**Symptoms:**

- Blank page
- 404 errors
- Assets not loading

**Solutions:**

```bash
# 1. Check if frontend is built
ls -la dist/

# 2. Rebuild frontend
npm run build

# 3. Check if preview server is running
curl http://localhost:4173

# 4. Check PM2 logs
pm2 logs meeting-insights-frontend
```

### 6. Network and Connectivity Issues

#### Problem: API Calls Failing

**Symptoms:**

- Network errors
- Timeout errors
- 500/404 errors

**Solutions:**

```bash
# 1. Check if backend is running
curl http://localhost:3001/health

# 2. Check firewall settings
sudo ufw status

# 3. Check Nginx configuration
sudo nginx -t

# 4. Check backend logs
pm2 logs meeting-insights-backend
```

#### Problem: SSL Certificate Issues

**Symptoms:**

- "Not Secure" warning
- SSL certificate errors
- HTTPS not working

**Solutions:**

```bash
# 1. Check SSL certificate
sudo certbot certificates

# 2. Renew certificate
sudo certbot renew

# 3. Check Nginx SSL configuration
sudo nginx -t

# 4. Restart Nginx
sudo systemctl restart nginx
```

## 🔍 Diagnostic Commands

### System Health Check

```bash
# Check all services
pm2 status
sudo systemctl status nginx
sudo systemctl status ufw

# Check ports
netstat -tlnp | grep :3001
netstat -tlnp | grep :4173
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

### Environment Variable Check

```bash
# Check frontend environment variables
node -e "console.log(import.meta.env)" 2>/dev/null || echo "Frontend env check failed"

# Check backend environment variables
node -e "require('dotenv').config({path: './backend/.env'}); console.log(process.env)" 2>/dev/null || echo "Backend env check failed"

# Check specific variables
grep -E "VITE_|AZURE_|PINECONE_" .env backend/.env
```

### Network Connectivity Check

```bash
# Check local connectivity
curl -I http://localhost:3001/health
curl -I http://localhost:4173

# Check external connectivity
curl -I https://api.openai.com
curl -I https://api.pinecone.io

# Check DNS resolution
nslookup yourdomain.com
```

## 🚨 Emergency Recovery

### Complete Service Restart

```bash
# Stop all services
pm2 stop all
sudo systemctl stop nginx

# Clear any stuck processes
pkill -f node
pkill -f tsx

# Restart services
sudo systemctl start nginx
pm2 start all
pm2 save
```

### Environment Reset

```bash
# Backup current environment
cp .env .env.backup
cp backend/.env backend/.env.backup

# Reset to example files
cp env.example .env
cp backend/env.example backend/.env

# Edit with your actual values
nano .env
nano backend/.env
```

### Complete Rebuild

```bash
# Stop services
pm2 stop all

# Clean build
rm -rf node_modules dist
npm install
npm run build

# Restart services
pm2 start all
```

## 📞 Getting Help

### Log Files to Check

```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u nginx
sudo journalctl -u meeting-insights-backend
```

### Information to Provide

When seeking help, provide:

1. **Error messages** (exact text)
2. **Log files** (relevant sections)
3. **Environment** (OS, Node.js version)
4. **Configuration** (environment variables - without sensitive data)
5. **Steps to reproduce**

### Useful Commands

```bash
# System information
uname -a
node -v
npm -v
pm2 -v

# Service status
pm2 status
sudo systemctl status nginx

# Network status
ss -tlnp
curl -I http://localhost:3001/health
```

This troubleshooting guide should help you resolve most common issues with the Meeting Insights Extractor deployment.



