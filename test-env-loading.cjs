// Test script to verify .env file loading (CommonJS version)
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing .env file loading...\n');

// Check if .env file exists
const envPath = path.resolve('.env');
console.log('📁 .env file path:', envPath);
console.log('📁 .env file exists:', fs.existsSync(envPath));

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  process.exit(1);
}

// Read .env file directly
const envContent = fs.readFileSync(envPath, 'utf8');
console.log('📋 .env file content:');
console.log(envContent);

// Parse .env file manually
const envVars = {};
envContent.split('\n').forEach((line, index) => {
  console.log(`Line ${index + 1}: "${line}"`);
  
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      envVars[key.trim()] = value;
      console.log(`  ✅ Parsed: ${key.trim()} = ${value.substring(0, 10)}...`);
    }
  }
});

console.log('\n📊 Parsed environment variables:');
console.log('AZURE_OPENAI_API_KEY:', envVars.AZURE_OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('AZURE_OPENAI_ENDPOINT:', envVars.AZURE_OPENAI_ENDPOINT ? 'SET' : 'NOT SET');
console.log('GEMINI_API_KEY:', envVars.GEMINI_API_KEY ? 'SET' : 'NOT SET');

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
