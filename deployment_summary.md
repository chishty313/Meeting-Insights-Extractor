Production Deployment Documentation: Meeting Insights ExtractorThis document outlines the complete server setup, code deployment, configuration, and troubleshooting steps performed on the server niftyai-chisty2 (IP: 20.244.80.234) to deploy the Vite/React application "Meeting Insights Extractor" to the domain https://assistant.niftyai.net.1. Initial Access and Server Preparation1.1. SSH AccessAccess was secured using a private key file (server_key.pem) saved locally, ensuring correct permissions were set (chmod 400).# 1. Set permissions
chmod 400 /path/to/server_key.pem
# 2. Login command
ssh -i /path/to/server_key.pem nifty@20.244.80.234
1.2. Installing DependenciesThe server was prepared by installing necessary system packages and tools, including NVM for Node.js management, PM2 for process management, Nginx for the reverse proxy, and Git.# Update and install core tools
sudo apt update
sudo apt install git nginx snapd -y

# Install NVM and Node.js v22 (to ensure the latest patches)
curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh) | bash
source ~/.bashrc 
nvm install 22
nvm use 22

# Install PM2 globally
npm install pm2 -g
2. Code Deployment and BuildThe code was deployed to the directory /var/www/meeting-insights-extractor.2.1. Directory Setup and Cloning# Create directory and set ownership for user 'nifty'
sudo mkdir -p /var/www/meeting-insights-extractor
sudo chown -R nifty:nifty /var/www/meeting-insights-extractor
cd /var/www/meeting-insights-extractor

# Clone the repository
git clone [https://github.com/chishty313/Meeting-Insights-Extractor.git](https://github.com/chishty313/Meeting-Insights-Extractor.git) .
2.2. Critical Directory Fix (Troubleshooting #1)The git clone command created an extra nested folder. This was corrected to place package.json in the root.# Move contents up one level and remove the empty subdirectory
mv Meeting-Insights-Extractor/* .
mv Meeting-Insights-Extractor/.* .
rm -r Meeting-Insights-Extractor
2.3. Install and BuildThe application dependencies were installed, and the production build was created (outputting static files to the dist folder, typical for Vite).npm install
npm run build
3. Process Management (PM2 & Environment Variables)The Vite application was launched using PM2 to manage the background process and ensure the environment variables were securely loaded.3.1. Create .env FileThe .env file was created in the root directory to store critical secrets.# nano .env
# Content:
AZURE_OPENAI_API_KEY=your_actual_key
AZURE_OPENAI_ENDPOINT=your_actual_endpoint
3.2. Create PM2 Ecosystem File (Troubleshooting #2 & #3)A custom PM2 ecosystem file was created to load the .env file and to fix the ESM vs. CJS module conflict that blocked PM2's startup.# Rename the file to .cjs to satisfy the project's "type": "module" setting
mv ecosystem.config.js ecosystem.config.cjs 
# nano ecosystem.config.cjs
ecosystem.config.cjs content:module.exports = {
  apps : [{
    name   : "meeting-insights-prod",
    script : "npm",
    args   : "run preview",
    cwd    : "/var/www/meeting-insights-extractor",
    env_production: {
      NODE_ENV: "production",
      // This tells PM2 to load the variables from .env
      NODE_CONFIG_FILE: "./.env" 
    }
  }]
};
3.3. Launch Application# Delete previous attempts
pm2 delete meeting-insights-prod
# Start using the new ecosystem file
pm2 start ecosystem.config.cjs --env production
# Save config for boot
pm2 save
4. Reverse Proxy (Nginx) ConfigurationNginx was configured to accept external traffic on port 80/443 and forward it to the internal Vite preview server (port 4173).4.1. Configure Nginx and Fix Site ConflictThe Nginx default welcome page was disabled, and the custom site was configured to listen on the correct public domain and IP.# Remove the default Nginx welcome page config
sudo rm /etc/nginx/sites-enabled/default 

# Create link to activate custom config
sudo ln -s /etc/nginx/sites-available/meeting-insights-prod /etc/nginx/sites-enabled/
4.2. Correcting Proxy Pass (Troubleshooting #4)The 504 Gateway Time-out error was resolved by changing the proxy_pass destination from the public IP to the internal loopback address (localhost).meeting-insights-prod Nginx Configuration (HTTPS version):server {
    server_name 20.244.80.234 assistant.niftyai.net;

    location / {
        # FIX: Changed from [http://20.244.80.234:4173](http://20.244.80.234:4173) to localhost to prevent 504 errors
        proxy_pass http://localhost:4173; 

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # ... Certbot SSL details
    listen 443 ssl; 
    ssl_certificate /etc/letsencrypt/live/assistant.niftyai.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/assistant.niftyai.net/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
# HTTP Redirect block (Managed by Certbot)
server {
    if ($host = assistant.niftyai.net) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name 20.244.80.234 assistant.niftyai.net;
    return 404;
}
4.3. Final Nginx Reloadsudo nginx -t
sudo systemctl restart nginx
5. Vite Host Security Fix (Troubleshooting #5)The application displayed a "Blocked request. This host is not allowed." message, requiring a configuration change within the application itself.The file vite.config.js was modified to explicitly allow the public domain and IP.vite.config.js change:export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'assistant.niftyai.net',  // CRITICAL FIX: Allows public domain access
      '20.244.80.234'           // Allows public IP access
    ],
    host: '0.0.0.0'             // Ensures server listens on all interfaces
  }
});
6. Security (HTTPS/SSL)Certbot was installed and run to secure the domain with a free SSL certificate from Let's Encrypt, ensuring all traffic is encrypted via HTTPS.# Installation of Certbot (if needed)
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Running Certbot
sudo certbot --nginx -d assistant.niftyai.net
Note: This step automatically enabled the firewall (UFW) and opened ports 80 and 443.