require('dotenv').config();
const pool = require('./db');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, house_id)
    )
  `);
  console.log('favorites table OK');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
