const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fire_ext_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  await client.connect();
  console.log('✅ Connected to PostgreSQL');

  const migrationsDir = path.join(__dirname, '../database/migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await client.query(sql);
    console.log(`✅ ${file} applied`);
  }

  await client.end();
  console.log('🎉 All migrations complete');
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
