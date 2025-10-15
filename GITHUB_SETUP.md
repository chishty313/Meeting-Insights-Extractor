# 🐙 GitHub Repository Setup Guide

## 📋 Prerequisites

- GitHub account
- Git installed on your local machine
- SSH key configured (recommended) or GitHub CLI

## 🚀 Step-by-Step GitHub Setup

### 1. Create GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. **Click "New repository"** (green button or + icon)
3. **Repository settings:**
   - **Repository name**: `meeting-insights-extractor`
   - **Description**: `AI-powered meeting insights extractor with RAG pipeline`
   - **Visibility**: Choose Public or Private
   - **Initialize**: ❌ Don't initialize with README, .gitignore, or license (we have our own)
4. **Click "Create repository"**

### 2. Initialize Local Git Repository

```bash
# Navigate to your project directory
cd /Users/chishty/Downloads/meeting-insights-extractor

# Initialize git repository
git init

# Add remote origin (replace with your actual GitHub repository URL)
git remote add origin https://github.com/yourusername/meeting-insights-extractor.git

# Or if using SSH:
# git remote add origin git@github.com:yourusername/meeting-insights-extractor.git
```

### 3. Configure Git (if not already done)

```bash
# Set your name and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

### 4. Add and Commit Files

```bash
# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: Meeting Insights Extractor with RAG pipeline

- React frontend with Vite
- Express.js backend with RAG pipeline
- Azure OpenAI integration
- Pinecone vector database
- PDF upload support
- Comprehensive deployment setup"
```

### 5. Push to GitHub

```bash
# Push to main branch
git push -u origin main
```

### 6. Verify Upload

1. **Go to your GitHub repository**
2. **Check that all files are present:**
   - `DEPLOYMENT.md`
   - `deploy.sh`
   - `setup-server.sh`
   - `nginx.conf`
   - `env.example`
   - `backend/env.example`
   - `.gitignore`
   - All source code files

## 🔧 Repository Configuration

### 1. Add Repository Description

Go to your repository → Settings → General → About:

- **Description**: `AI-powered meeting insights extractor with RAG pipeline for intelligent meeting analysis`
- **Website**: Your deployed URL (after deployment)
- **Topics**: Add relevant tags like `ai`, `meeting-analysis`, `rag`, `react`, `nodejs`

### 2. Configure Branch Protection (Optional)

Go to Settings → Branches → Add rule:

- **Branch name pattern**: `main`
- **Require pull request reviews**: ✅ (if working with team)
- **Require status checks**: ✅ (if using CI/CD)

### 3. Add Repository Secrets (for CI/CD)

Go to Settings → Secrets and variables → Actions:

- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `PINECONE_API_KEY`
- `GEMINI_API_KEY` (optional)
- `ZOOM_CLIENT_ID` (optional)

## 📁 Repository Structure

Your repository should have this structure:

```
meeting-insights-extractor/
├── .gitignore
├── DEPLOYMENT.md
├── GITHUB_SETUP.md
├── deploy.sh
├── setup-server.sh
├── nginx.conf
├── env.example
├── package.json
├── vite.config.ts
├── tsconfig.json
├── App.tsx
├── components/
├── services/
├── lib/
├── contexts/
├── backend/
│   ├── env.example
│   ├── server.ts
│   ├── services/
│   └── utils/
└── README.md (optional)
```

## 🔄 Workflow for Updates

### 1. Making Changes

```bash
# Make your changes to files
# Test locally

# Add changes
git add .

# Commit with descriptive message
git commit -m "Add new feature: PDF upload support"

# Push to GitHub
git push origin main
```

### 2. Creating Releases

1. **Go to your repository on GitHub**
2. **Click "Releases" → "Create a new release"**
3. **Tag version**: `v1.0.0`
4. **Release title**: `Meeting Insights Extractor v1.0.0`
5. **Description**: Include changelog
6. **Publish release**

### 3. Branching Strategy (Optional)

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push feature branch
git push origin feature/new-feature

# Create Pull Request on GitHub
# Merge after review
```

## 🚀 Deployment from GitHub

### 1. Clone on Server

```bash
# On your server
git clone https://github.com/yourusername/meeting-insights-extractor.git
cd meeting-insights-extractor
```

### 2. Run Deployment Script

```bash
# Make scripts executable
chmod +x deploy.sh setup-server.sh

# Run deployment
./deploy.sh
```

## 🔒 Security Considerations

### 1. Environment Variables

- ✅ **Never commit** `.env` files
- ✅ **Use** `.env.example` files
- ✅ **Add** `.env` to `.gitignore`
- ✅ **Use** repository secrets for CI/CD

### 2. API Keys

- ✅ **Rotate** API keys regularly
- ✅ **Use** different keys for development/production
- ✅ **Monitor** API usage
- ✅ **Set** appropriate rate limits

### 3. Repository Access

- ✅ **Use** SSH keys instead of passwords
- ✅ **Enable** two-factor authentication
- ✅ **Review** collaborator access regularly
- ✅ **Use** branch protection rules

## 📊 Monitoring and Maintenance

### 1. Repository Insights

- **Traffic**: Monitor repository views and clones
- **Contributors**: Track who's contributing
- **Issues**: Use GitHub Issues for bug tracking
- **Discussions**: Use GitHub Discussions for community

### 2. Automated Updates

```bash
# Create update script
cat > update.sh << 'EOF'
#!/bin/bash
cd /opt/meeting-insights
git pull origin main
npm install
npm run build
pm2 restart all
EOF

chmod +x update.sh
```

### 3. Backup Strategy

```bash
# Create backup script
cat > backup-repo.sh << 'EOF'
#!/bin/bash
DATE=$(date '+%Y%m%d_%H%M%S')
tar -czf "backup_$DATE.tar.gz" /opt/meeting-insights
EOF

chmod +x backup-repo.sh
```

## 🆘 Troubleshooting

### Common Issues

1. **Permission Denied**

   ```bash
   # Fix SSH key permissions
   chmod 600 ~/.ssh/id_rsa
   chmod 644 ~/.ssh/id_rsa.pub
   ```

2. **Large File Upload**

   ```bash
   # Use Git LFS for large files
   git lfs install
   git lfs track "*.pdf"
   git add .gitattributes
   ```

3. **Merge Conflicts**
   ```bash
   # Resolve conflicts
   git status
   # Edit conflicted files
   git add .
   git commit
   ```

## 📞 Support

If you encounter issues:

1. **Check GitHub status**: https://status.github.com/
2. **Review repository settings**
3. **Check file permissions**
4. **Verify SSH key configuration**
5. **Check network connectivity**

Your repository is now ready for deployment! 🎉



