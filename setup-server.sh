#!/bin/bash

# Server Setup Script for Meeting Insights Extractor
# Run this script on a fresh Ubuntu/CentOS server

set -e  # Exit on any error

echo "🖥️  Setting up server for Meeting Insights Extractor..."

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
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    print_error "Cannot detect OS"
    exit 1
fi

print_status "Detected OS: $OS $VER"

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"

# Install essential packages
print_status "Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
print_success "Essential packages installed"

# Install Node.js 20
print_status "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
print_success "Node.js installed: $(node -v)"

# Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2
print_success "PM2 installed"

# Install Nginx
print_status "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
print_success "Nginx installed and started"

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 3001  # Backend port
print_success "Firewall configured"

# Create application user
print_status "Creating application user..."
if ! id "meeting-insights" &>/dev/null; then
    useradd -m -s /bin/bash meeting-insights
    usermod -aG sudo meeting-insights
    print_success "User 'meeting-insights' created"
else
    print_warning "User 'meeting-insights' already exists"
fi

# Create application directory
print_status "Setting up application directory..."
mkdir -p /opt/meeting-insights
chown meeting-insights:meeting-insights /opt/meeting-insights
print_success "Application directory created"

# Install Certbot for SSL (optional)
print_status "Installing Certbot for SSL certificates..."
apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# Create systemd service for the application (alternative to PM2)
print_status "Creating systemd service..."
cat > /etc/systemd/system/meeting-insights-backend.service << EOF
[Unit]
Description=Meeting Insights Extractor Backend
After=network.target

[Service]
Type=simple
User=meeting-insights
WorkingDirectory=/opt/meeting-insights
ExecStart=/usr/bin/npx tsx backend/server.ts
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
print_success "Systemd service created"

# Create log directory
print_status "Creating log directory..."
mkdir -p /var/log/meeting-insights
chown meeting-insights:meeting-insights /var/log/meeting-insights
print_success "Log directory created"

# Create backup directory
print_status "Creating backup directory..."
mkdir -p /opt/backups/meeting-insights
chown meeting-insights:meeting-insights /opt/backups/meeting-insights
print_success "Backup directory created"

# Create monitoring script
print_status "Creating monitoring script..."
cat > /usr/local/bin/meeting-insights-monitor.sh << 'EOF'
#!/bin/bash
# Meeting Insights Extractor Monitoring Script

LOG_FILE="/var/log/meeting-insights/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check if backend is running
if ! curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "[$DATE] Backend health check failed" >> $LOG_FILE
    # Restart backend if using PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart meeting-insights-backend
        echo "[$DATE] Backend restarted via PM2" >> $LOG_FILE
    fi
fi

# Check if frontend is running
if ! curl -f http://localhost:4173 > /dev/null 2>&1; then
    echo "[$DATE] Frontend health check failed" >> $LOG_FILE
    # Restart frontend if using PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart meeting-insights-frontend
        echo "[$DATE] Frontend restarted via PM2" >> $LOG_FILE
    fi
fi
EOF

chmod +x /usr/local/bin/meeting-insights-monitor.sh
print_success "Monitoring script created"

# Setup cron job for monitoring
print_status "Setting up monitoring cron job..."
echo "*/5 * * * * /usr/local/bin/meeting-insights-monitor.sh" | crontab -u meeting-insights -
print_success "Monitoring cron job set up"

# Create backup script
print_status "Creating backup script..."
cat > /usr/local/bin/meeting-insights-backup.sh << 'EOF'
#!/bin/bash
# Meeting Insights Extractor Backup Script

BACKUP_DIR="/opt/backups/meeting-insights"
DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.tar.gz"

# Create backup
tar -czf "$BACKUP_FILE" -C /opt/meeting-insights .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE"
EOF

chmod +x /usr/local/bin/meeting-insights-backup.sh
print_success "Backup script created"

# Setup daily backup
print_status "Setting up daily backup..."
echo "0 2 * * * /usr/local/bin/meeting-insights-backup.sh" | crontab -u meeting-insights -
print_success "Daily backup scheduled"

print_success "Server setup completed successfully!"
print_status "Next steps:"
echo "1. Switch to the meeting-insights user: sudo su - meeting-insights"
echo "2. Clone your repository: git clone <your-repo-url> /opt/meeting-insights"
echo "3. Run the deployment script: ./deploy.sh"
echo "4. Configure Nginx with the provided nginx.conf"
echo "5. Set up your domain and SSL certificate"

print_status "Server is ready for deployment!"



