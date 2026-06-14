#!/usr/bin/env node

/**
 * FireShield Database Truncate Script
 * This script truncates all tables in the database
 * WARNING: This will delete ALL data!
 */

const { Client } = require('pg');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fire_ext_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
};

console.log('========================================');
console.log('⚠️  DATABASE TRUNCATE WARNING ⚠️');
console.log('========================================');
console.log('');
console.log('This will DELETE ALL DATA from:');
console.log(`  Database: ${config.database}`);
console.log(`  Host: ${config.host}:${config.port}`);
console.log('');
console.log('Tables that will be truncated:');
console.log('  - users');
console.log('  - otp_codes');
console.log('  - extinguishers');
console.log('  - notifications');
console.log('  - escalations');
console.log('  - audit_logs');
console.log('');

async function confirmAction() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Type "DELETE ALL DATA" to confirm: ', (answer) => {
      rl.close();
      resolve(answer === 'DELETE ALL DATA');
    });
  });
}

async function truncateTables(client) {
  console.log('Truncating tables...');
  console.log('');

  const tables = [
    'audit_logs',
    'escalations',
    'notifications',
    'extinguishers',
    'otp_codes',
    'users'
  ];

  try {
    // Disable foreign key checks temporarily
    await client.query('SET session_replication_role = replica;');

    for (const table of tables) {
      try {
        await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
        console.log(`✓ Truncated: ${table}`);
      } catch (error) {
        console.log(`✗ Failed to truncate ${table}: ${error.message}`);
      }
    }

    // Re-enable foreign key checks
    await client.query('SET session_replication_role = DEFAULT;');

    console.log('');
    console.log('✓ All tables truncated successfully');
    return true;
  } catch (error) {
    console.error('✗ Error during truncation:', error.message);
    return false;
  }
}

async function main() {
  // Check if running in non-interactive mode (from batch file)
  const isNonInteractive = process.argv.includes('--force');

  if (!isNonInteractive) {
    const confirmed = await confirmAction();
    if (!confirmed) {
      console.log('');
      console.log('Operation cancelled.');
      console.log('');
      process.exit(0);
    }
  }

  console.log('');
  console.log('Proceeding with truncation...');
  console.log('');

  const client = new Client(config);

  try {
    // Connect to database
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully');
    console.log('');

    // Truncate tables
    const success = await truncateTables(client);

    if (success) {
      console.log('');
      console.log('========================================');
      console.log('Database truncated successfully!');
      console.log('========================================');
      console.log('');
      console.log('All data has been deleted.');
      console.log('Run "npm run db:seed" or "scripts\\seed-database.bat" to re-seed the database.');
      console.log('');
    } else {
      console.log('');
      console.log('Truncation completed with errors.');
      console.log('');
      process.exit(1);
    }

  } catch (error) {
    console.error('✗ Database connection failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify PostgreSQL is running');
    console.error('2. Check database credentials in .env file');
    console.error('3. Ensure database "fire_ext_db" exists');
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
