const pool = require('./db');

async function migrate() {
  await pool.query(`
    ALTER TABLE houses
      ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(20) DEFAULT 'flexible'
        CHECK (cancellation_policy IN ('flexible','moderate','strict'))
  `);
  console.log('✓ cancellation_policy ajouté à houses');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
