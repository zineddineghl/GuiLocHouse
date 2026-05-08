const pool = require('./db');

async function migrate() {
  try {
    await pool.query(`ALTER TABLE houses ADD COLUMN IF NOT EXISTS rental_type VARCHAR(20) DEFAULT 'entire'`);
    await pool.query(`ALTER TABLE houses ADD COLUMN IF NOT EXISTS beds INTEGER DEFAULT 1`);
    await pool.query(`ALTER TABLE houses ADD COLUMN IF NOT EXISTS pets_allowed INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE houses ADD COLUMN IF NOT EXISTS min_nights INTEGER DEFAULT 1`);
    await pool.query(`ALTER TABLE houses ADD COLUMN IF NOT EXISTS max_nights INTEGER`);
    console.log('Migration OK : rental_type, beds, pets_allowed, min_nights, max_nights ajoutés');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
