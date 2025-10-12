# 🚀 Production Deployment Guide

## 🔧 Environment Variables Configuration

The application requires environment variables to be set on your server. Here's how to configure them for different platforms:

### 📋 Required Environment Variables

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

## 🌐 Platform-Specific Instructions

### 1. Vercel Deployment

#### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository: `chishty313/Meeting-Insights-Extractor`

#### Step 2: Configure Environment Variables

1. Go to **Project Settings** → **Environment Variables**
2. Add each variable:
   ```
   AZURE_OPENAI_API_KEY = your_azure_key_here
   AZURE_OPENAI_ENDPOINT = your_azure_endpoint_here
   GEMINI_API_KEY = your_gemini_key_here (optional)
   ZOOM_CLIENT_ID = your_zoom_client_id_here (optional)
   ZOOM_CLIENT_SECRET = your_zoom_client_secret_here (optional)
   ZOOM_ACCOUNT_ID = your_zoom_account_id_here (optional)
   ```

#### Step 3: Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Step 4: Deploy

- Click "Deploy"
- Wait for build to complete
- Your app will be available at `https://your-project.vercel.app`

### 2. Netlify Deployment

#### Step 1: Connect Repository

1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository

#### Step 2: Configure Build Settings

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Base directory**: (leave empty)

#### Step 3: Set Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Add each variable (same as Vercel)

#### Step 4: Deploy

- Click "Deploy site"
- Your app will be available at `https://your-site.netlify.app`

### 3. Railway Deployment

#### Step 1: Connect Repository

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

#### Step 2: Configure Environment Variables

1. Go to **Variables** tab
2. Add each environment variable
3. Railway will automatically detect it's a Vite project

#### Step 3: Deploy

- Railway will automatically build and deploy
- Your app will be available at `https://your-app.railway.app`

### 4. DigitalOcean App Platform

#### Step 1: Create App

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repository

#### Step 2: Configure App Spec

```yaml
name: meeting-insights-extractor
services:
  - name: web
    source_dir: /
    github:
      repo: chishty313/Meeting-Insights-Extractor
      branch: main
    run_command: npm run dev
    build_command: npm run build
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: AZURE_OPENAI_API_KEY
        value: your_azure_key_here
      - key: AZURE_OPENAI_ENDPOINT
        value: your_azure_endpoint_here
```

#### Step 3: Deploy

- Click "Create Resources"
- Your app will be available at `https://your-app.ondigitalocean.app`

## 🔍 Troubleshooting

### Issue: "Azure Configuration Required" Error

**Cause**: Environment variables are not being loaded properly.

**Solutions**:

1. **Check Environment Variables**:

   ```bash
   # On your server, verify variables are set
   echo $AZURE_OPENAI_API_KEY
   echo $AZURE_OPENAI_ENDPOINT
   ```

2. **For Vercel/Netlify**:

   - Go to project settings
   - Check Environment Variables section
   - Ensure all required variables are set
   - Redeploy after adding variables

3. **For Custom Servers**:

   ```bash
   # Create .env file in project root
   echo "AZURE_OPENAI_API_KEY=your_key_here" > .env
   echo "AZURE_OPENAI_ENDPOINT=your_endpoint_here" >> .env

   # Restart your application
   npm run build
   npm run preview
   ```

4. **For Docker**:
   ```dockerfile
   # In your Dockerfile
   ENV AZURE_OPENAI_API_KEY=your_key_here
   ENV AZURE_OPENAI_ENDPOINT=your_endpoint_here
   ```

### Issue: Build Failures

**Solutions**:

1. **Clear cache**: `npm run build -- --force`
2. **Check Node.js version**: Ensure Node.js 18+ is used
3. **Verify dependencies**: `npm install` before building

### Issue: CORS Errors

**Solutions**:

1. **Use HTTPS**: Ensure your deployment uses HTTPS
2. **Check API endpoints**: Verify Azure OpenAI endpoints are correct
3. **Update CORS settings**: In Azure OpenAI, ensure your domain is allowed

## ✅ Verification Steps

After deployment, verify your setup:

1. **Check Environment Variables**:

   - Open browser console
   - Check if configuration notice is gone
   - Try uploading a small audio file

2. **Test All Modes**:

   - **Audio Mode**: Upload a test audio file
   - **Transcript Mode**: Paste sample transcript
   - **Zoom Mode**: Enter a test meeting ID (if configured)

3. **Check Console for Errors**:
   - Open browser developer tools
   - Look for any JavaScript errors
   - Check network requests

## 🎯 Success Indicators

Your deployment is successful when:

- ✅ No "Azure Configuration Required" message
- ✅ All three modes (Audio, Transcript, Zoom) are visible
- ✅ File upload works without errors
- ✅ Processing completes successfully
- ✅ Results are displayed properly

## 🆘 Need Help?

If you're still having issues:

1. **Check the logs** in your deployment platform
2. **Verify environment variables** are set correctly
3. **Test locally** with the same environment variables
4. **Check browser console** for any client-side errors
5. **Verify API keys** are valid and have proper permissions

## 📞 Support

- **GitHub Issues**: [Create an issue](https://github.com/chishty313/Meeting-Insights-Extractor/issues)
- **Documentation**: Check README.md for detailed setup instructions
- **Environment Variables**: Refer to .env.example for required variables
