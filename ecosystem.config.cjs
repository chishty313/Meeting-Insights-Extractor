module.exports = {
  apps: [{
    name: "meeting-insights-prod",
    script: "npm",
    args: "run preview",
    cwd: "/var/www/meeting-insights-extractor",
    env_production: {
      NODE_ENV: "production",
      PORT: 4173
    },
    // Load environment variables from .env file
    env_file: "./.env",
    // Auto-restart on file changes
    watch: false,
    // Restart if app crashes
    autorestart: true,
    // Max memory usage before restart
    max_memory_restart: "1G",
    // Log files
    log_file: "./logs/combined.log",
    out_file: "./logs/out.log",
    error_file: "./logs/error.log",
    // Log rotation
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
};
