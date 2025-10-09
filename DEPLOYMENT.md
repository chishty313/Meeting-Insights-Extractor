# 🚀 Vercel Deployment Guide

## Prerequisites

- Vercel account (free tier available)
- Your Azure OpenAI API credentials
- Your Gemini API key (optional)

## Step 1: Prepare Your Project

1. **Install dependencies**: `npm install`
2. **Test locally**: `npm run dev`

## Step 2: Deploy to Vercel

1. **Connect to Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Or use Vercel CLI: `npx vercel`

2. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add these variables:
     ```
     AZURE_OPENAI_API_KEY=your_azure_key_here
     AZURE_OPENAI_ENDPOINT=your_azure_endpoint_here
     GEMINI_API_KEY=your_gemini_key_here
     ```

## Step 3: File Upload Considerations

### ✅ What Works:

- **Transcript Mode**: Perfect for Vercel (text files are tiny)
- **Small Audio Files**: < 4.5MB (Hobby plan) or < 50MB (Enterprise)
- **Text Processing**: No issues with API calls

### ⚠️ Potential Issues:

- **Large Audio Files**: May hit Vercel's request size limits
- **CORS**: Direct browser-to-Azure calls might be blocked
- **API Timeouts**: Long audio processing might timeout

### 🔧 Solutions:

1. **Use API Routes**: The included `/pages/api/` routes handle CORS
2. **File Size Validation**: Add client-side file size checks
3. **Progress Indicators**: Show processing status to users

## Step 4: Test Your Deployment

1. **Upload a small audio file** (< 1MB)
2. **Try transcript mode** with sample text
3. **Check browser console** for any CORS errors
4. **Verify environment variables** are loaded

## Step 5: Optimize for Production

1. **Add file size limits** in your components
2. **Implement error handling** for API failures
3. **Add loading states** for better UX
4. **Consider CDN** for static assets

## Troubleshooting

### Common Issues:

- **"API key not configured"**: Check environment variables in Vercel
- **CORS errors**: Use the included API routes instead of direct calls
- **File too large**: Implement file size validation
- **Timeout errors**: Consider upgrading to Pro plan for longer timeouts

### File Size Limits:

- **Hobby Plan**: 4.5MB max request
- **Pro Plan**: 4.5MB max request
- **Enterprise**: 50MB max request

## Recommended Settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Success! 🎉

Your meeting insights extractor should now be live on Vercel with:

- ✅ Audio file uploads
- ✅ Transcript processing
- ✅ Azure OpenAI integration
- ✅ Speaker labeling
- ✅ Structured summaries
