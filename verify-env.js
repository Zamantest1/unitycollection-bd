#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * 
 * This script checks if all required environment variables are properly configured
 * Usage: node verify-env.js
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];

// Check if we're in a CI/CD environment
const isCIEnvironment = process.env.CI === 'true' || process.env.VERCEL === '1';

console.log('\n🔍 Verifying Environment Variables Setup...\n');

// Load .env.local if it exists
let envLocalPath = path.join(process.cwd(), '.env.local');
let envPath = path.join(process.cwd(), '.env');

let hasEnvLocal = fs.existsSync(envLocalPath);
let hasEnv = fs.existsSync(envPath);

console.log(`📁 Configuration Files:`);
console.log(`   ${hasEnvLocal ? '✅' : '⚠️ '} .env.local${hasEnvLocal ? ' (found)' : ' (not found - use for local dev)'}`);
console.log(`   ${hasEnv ? '✅' : '⚠️ '} .env${hasEnv ? ' (found)' : ' (not found)'}`);

console.log(`\n🔐 Required Variables:`);

let allPresent = true;
let missingVars = [];

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  const isPresent = !!value;
  const display = isPresent ? '✅' : '❌';
  
  console.log(`   ${display} ${varName}${isPresent ? '' : ' (MISSING)'}`);
  
  if (!isPresent) {
    allPresent = false;
    missingVars.push(varName);
  }
});

console.log('\n' + '='.repeat(60));

if (allPresent) {
  console.log('\n✅ SUCCESS: All required environment variables are configured!\n');
  process.exit(0);
} else {
  console.log('\n❌ ERROR: Missing required environment variables!\n');
  console.log('Missing variables:', missingVars.join(', '));
  
  if (!isCIEnvironment) {
    console.log('\n📝 Setup Instructions:');
    console.log('   1. Copy .env.local.example to .env.local');
    console.log('   2. Fill in your Supabase credentials');
    console.log('   3. Restart your development server');
  } else {
    console.log('\n⚙️  For Vercel Deployment:');
    console.log('   1. Go to Vercel Dashboard > Project Settings > Environment Variables');
    console.log('   2. Add the missing variables for Production/Preview/Development');
    console.log('   3. Redeploy your project');
  }
  
  console.log('\n📚 Reference: ENVIRONMENT_VARIABLES_SETUP.md\n');
  process.exit(1);
}
