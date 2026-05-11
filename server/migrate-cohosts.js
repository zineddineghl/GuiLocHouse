const pool = require('./db');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS house_cohosts (
      id         SERIAL PRIMARY KEY,
      house_id   INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(house_id, user_id)
    )
  `);
  console.log('✓ Table house_cohosts créée');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
