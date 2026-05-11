const pool = require('./db');

async function migrate() {
  await pool.query(`
    ALTER TABLE houses
      ADD COLUMN IF NOT EXISTS check_in_time   VARCHAR(5),
      ADD COLUMN IF NOT EXISTS check_out_time  VARCHAR(5),
      ADD COLUMN IF NOT EXISTS smoking_allowed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS extra_rules     TEXT
  `);
  console.log('✓ check_in_time, check_out_time, smoking_allowed, extra_rules ajoutés à houses');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
