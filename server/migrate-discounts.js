const pool = require('./db');

async function migrate() {
  await pool.query(`
    ALTER TABLE houses
      ADD COLUMN IF NOT EXISTS discount_weekly  INTEGER DEFAULT 0 CHECK (discount_weekly  BETWEEN 0 AND 90),
      ADD COLUMN IF NOT EXISTS discount_monthly INTEGER DEFAULT 0 CHECK (discount_monthly BETWEEN 0 AND 90)
  `);
  console.log('✓ discount_weekly + discount_monthly ajoutés à houses');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
