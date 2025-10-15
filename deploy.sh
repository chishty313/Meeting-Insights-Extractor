#!/bin/bash

# Meeting Insights Extractor - Deployment Script
# This script automates the deployment process on a server

set -e  # Exit on any error

echo "🚀 Starting Meeting Insights Extractor Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_success "PM2 is already installed"
fi

# Check if project directory exists
if [ ! -d "meeting-insights-extractor" ]; then
    print_error "Project directory 'meeting-insights-extractor' not found"
    print_status "Please clone the repository first:"
    echo "git clone https://github.com/yourusername/meeting-insights-extractor.git"
    exit 1
fi

cd meeting-insights-extractor

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed successfully"

# Check for environment files
if [ ! -f ".env" ]; then
    print_warning "Frontend .env file not found"
    if [ -f "env.example" ]; then
        print_status "Copying env.example to .env"
        cp env.example .env
        print_warning "Please edit .env file with your actual environment variables"
    else
        print_error "env.example file not found. Please create .env file manually"
        exit 1
    fi
fi

if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found"
    if [ -f "backend/env.example" ]; then
        print_status "Copying backend/env.example to backend/.env"
        cp backend/env.example backend/.env
        print_warning "Please edit backend/.env file with your actual environment variables"
    else
        print_error "backend/env.example file not found. Please create backend/.env file manually"
        exit 1
    fi
fi

# Build frontend
print_status "Building frontend..."
npm run build
print_success "Frontend built successfully"

# Stop existing PM2 processes if they exist
print_status "Stopping existing PM2 processes..."
pm2 stop meeting-insights-backend 2>/dev/null || true
pm2 stop meeting-insights-frontend 2>/dev/null || true
pm2 delete meeting-insights-backend 2>/dev/null || true
pm2 delete meeting-insights-frontend 2>/dev/null || true

# Start backend with PM2
print_status "Starting backend service..."
pm2 start backend/server.ts --name "meeting-insights-backend" --interpreter tsx
print_success "Backend service started"

# Wait a moment for backend to start
sleep 3

# Start frontend with PM2
print_status "Starting frontend service..."
pm2 start "npm run preview" --name "meeting-insights-frontend"
print_success "Frontend service started"

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save
print_success "PM2 configuration saved"

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup | grep -E '^sudo' | bash || true
print_success "PM2 startup script configured"

# Check if services are running
print_status "Checking service status..."
pm2 status

# Health check
print_status "Performing health checks..."

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed - service may still be starting"
fi

# Check frontend
if curl -f http://localhost:4173 > /dev/null 2>&1; then
    print_success "Frontend health check passed"
else
    print_warning "Frontend health check failed - service may still be starting"
fi

print_success "Deployment completed successfully!"
print_status "Services are running on:"
echo "  - Backend: http://localhost:3001"
echo "  - Frontend: http://localhost:4173"
print_status "Use 'pm2 logs' to view logs"
print_status "Use 'pm2 status' to check service status"
print_status "Use 'pm2 restart all' to restart all services"