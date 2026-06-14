#!/usr/bin/env node

/**
 * FireShield Database Seeding Script
 * This script runs migrations and seeds the database with admin users
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
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
console.log('FireShield Database Setup');
console.log('========================================');
console.log('');
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);
console.log(`Host: ${config.host}:${config.port}`);
console.log('');

async function runSQL(client, filePath, description, ignoreErrors = false) {
  console.log(`${description}...`);
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    console.log(`✓ ${description} completed successfully`);
    console.log('');
    return true;
  } catch (error) {
    if (ignoreErrors) {
      console.log(`⚠ ${description} skipped (already exists)`);
      console.log('');
      return true;
    }
    console.error(`✗ ERROR: ${description} failed!`);
    console.error(error.message);
    console.log('');
    return false;
  }
}

async function checkTablesExist(client) {
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

async function main() {
  const client = new Client(config);

  try {
    // Connect to database
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully');
    console.log('');

    // Check if tables already exist
    const tablesExist = await checkTablesExist(client);
    
    if (tablesExist) {
      console.log('⚠ Database tables already exist');
      console.log('Skipping migrations and proceeding to seeding...');
      console.log('');
      console.log('💡 TIP: To reset the database, run:');
      console.log('   npm run db:reset');
      console.log('   or use option 3 in the batch file menu');
      console.log('');
    } else {
      // Run migrations only if tables don't exist
      const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_schema.sql');
      const migrationSuccess = await runSQL(client, migrationPath, 'Step 1: Running migrations');
      
      if (!migrationSuccess) {
        console.log('Migration failed. Please check the error above.');
        process.exit(1);
      }
    }

    // Run seeds
    const seedPath = path.join(__dirname, '..', 'database', 'seeds', '001_seed_admin.sql');
    const seedSuccess = await runSQL(client, seedPath, 'Step 2: Seeding admin users', true);
    
    if (!seedSuccess) {
      console.log('Seeding failed. Please check the error above.');
      process.exit(1);
    }

    // Verify seeding
    const result = await client.query(
      `SELECT name, email, role, is_verified FROM users WHERE role IN ('admin', 'staff', 'customer') ORDER BY role`
    );

    console.log('========================================');
    console.log('Database setup complete!');
    console.log('========================================');
    console.log('');
    console.log('Default accounts created:');
    console.log('');
    
    result.rows.forEach(user => {
      if (user.role === 'admin') {
        console.log('ADMIN:');
        console.log(`  Email: ${user.email}`);
        console.log('  Password: Admin@2024');
        console.log('');
      } else if (user.role === 'staff') {
        console.log('STAFF:');
        console.log(`  Email: ${user.email}`);
        console.log('  Password: Staff@2024');
        console.log('');
      } else if (user.role === 'customer' && user.email === 'customer@example.com') {
        console.log('CUSTOMER (Test):');
        console.log(`  Email: ${user.email}`);
        console.log('  Password: Customer@2024');
        console.log('');
      }
    });

    console.log('⚠️  IMPORTANT: Change these passwords in production!');
    console.log('');
    console.log('See ADMIN_CREDENTIALS.md for more details.');
    console.log('');

  } catch (error) {
    console.error('✗ Database connection failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify PostgreSQL is running');
    console.error('2. Check database credentials in .env file');
    console.error('3. Ensure database "fire_ext_db" exists');
    console.error('   Create it with: CREATE DATABASE fire_ext_db;');
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
