const pool = require('./db');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS house_blocked_dates (
      id SERIAL PRIMARY KEY,
      house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('house_blocked_dates table created');
  pool.end();
}

migrate().catch(e => { console.error(e); pool.end(); });
