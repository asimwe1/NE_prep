const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seed() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fire_ext_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  await client.connect();
  console.log('✅ Connected. Seeding...');

  const hash = await bcrypt.hash('Admin@1234', 12);

  // Admin user
  await client.query(`
    INSERT INTO users (name, email, phone, national_id, password_hash, role, is_verified)
    VALUES ('Admin User', 'admin@fireshield.com', '+250788000001', 'ADMIN-001', $1, 'admin', true)
    ON CONFLICT (email) DO NOTHING
  `, [hash]);

  // Staff user
  await client.query(`
    INSERT INTO users (name, email, phone, national_id, password_hash, role, is_verified)
    VALUES ('Staff Member', 'staff@fireshield.com', '+250788000002', 'STAFF-001', $1, 'staff', true)
    ON CONFLICT (email) DO NOTHING
  `, [hash]);

  // Sample customers
  const customers = [
    { name: 'Jean Baptiste Nkurunziza', email: 'jean@example.com', phone: '+250788111001', national_id: '1198700123456789', address: 'KG 12 Ave, Kigali' },
    { name: 'Marie Claire Uwimana',     email: 'marie@example.com',phone: '+250788111002', national_id: '1199600234567890', address: 'KN 5 Rd, Kigali' },
    { name: 'Patrick Hakizimana',       email: 'patrick@example.com',phone: '+250788111003',national_id: '1198800345678901', address: 'KG 503 St, Kigali' },
  ];

  const customerHash = await bcrypt.hash('Customer@1234', 12);
  const customerIds = [];

  for (const c of customers) {
    const res = await client.query(`
      INSERT INTO users (name, email, phone, national_id, address, password_hash, role, is_verified)
      VALUES ($1,$2,$3,$4,$5,$6,'customer',true)
      ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name
      RETURNING id
    `, [c.name, c.email, c.phone, c.national_id, c.address, customerHash]);
    customerIds.push(res.rows[0].id);
  }

  // Extinguishers with various statuses
  const today = new Date();
  const extinguishers = [
    { idx: 0, qty: 4, purchase: '2023-01-15', expiry: new Date(today.getTime() + 5 * 24*60*60*1000).toISOString().split('T')[0] },  // expiring soon
    { idx: 0, qty: 2, purchase: '2022-06-01', expiry: new Date(today.getTime() - 10 * 24*60*60*1000).toISOString().split('T')[0] }, // expired
    { idx: 1, qty: 6, purchase: '2023-03-20', expiry: new Date(today.getTime() + 45 * 24*60*60*1000).toISOString().split('T')[0] }, // active
    { idx: 2, qty: 3, purchase: '2023-05-10', expiry: new Date(today.getTime() + 180 * 24*60*60*1000).toISOString().split('T')[0] },// active
  ];

  for (const e of extinguishers) {
    const daysLeft = Math.floor((new Date(e.expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const status = daysLeft < 0 ? 'expired' : daysLeft <= 14 ? 'expiring_soon' : 'active';
    await client.query(`
      INSERT INTO extinguishers (customer_id, quantity, purchase_date, expiry_date, status)
      VALUES ($1,$2,$3::date,$4::date,$5)
    `, [customerIds[e.idx], e.qty, e.purchase, e.expiry, status]);
  }

  await client.end();
  console.log('🎉 Seed complete!');
  console.log('\n📧 Test accounts:');
  console.log('  Admin:    admin@fireshield.com  / Admin@1234');
  console.log('  Staff:    staff@fireshield.com  / Admin@1234');
  console.log('  Customer: jean@example.com      / Customer@1234');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
