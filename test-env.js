// Test script to verify environment variables are loaded correctly
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing environment variable loading...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found at:', envPath);
  process.exit(1);
}

// Load .env file manually
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

console.log('📋 Environment variables from .env file:');
console.log('AZURE_OPENAI_API_KEY:', envVars.AZURE_OPENAI_API_KEY ? 'SET (length: ' + envVars.AZURE_OPENAI_API_KEY.length + ')' : 'NOT SET');
console.log('AZURE_OPENAI_ENDPOINT:', envVars.AZURE_OPENAI_ENDPOINT ? 'SET' : 'NOT SET');
console.log('GEMINI_API_KEY:', envVars.GEMINI_API_KEY ? 'SET (length: ' + envVars.GEMINI_API_KEY.length + ')' : 'NOT SET');
console.log('ZOOM_CLIENT_ID:', envVars.ZOOM_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('ZOOM_CLIENT_SECRET:', envVars.ZOOM_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('ZOOM_ACCOUNT_ID:', envVars.ZOOM_ACCOUNT_ID ? 'SET' : 'NOT SET');

// Check if Azure is configured
const isAzureConfigured = !!(envVars.AZURE_OPENAI_API_KEY && envVars.AZURE_OPENAI_ENDPOINT);
console.log('\n✅ Azure Configuration Status:', isAzureConfigured ? 'CONFIGURED' : 'NOT CONFIGURED');

if (!isAzureConfigured) {
  console.log('\n❌ Azure configuration is missing!');
  console.log('Please check your .env file and ensure:');
  console.log('- AZURE_OPENAI_API_KEY is set');
  console.log('- AZURE_OPENAI_ENDPOINT is set');
  process.exit(1);
}

console.log('\n✅ All environment variables are properly configured!');
