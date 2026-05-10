const pool = require('./db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS house_reviews (
        id                   SERIAL PRIMARY KEY,
        house_id             INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
        user_id              INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
        comment              TEXT    NOT NULL,
        rating_overall       DECIMAL(3,1) NOT NULL CHECK (rating_overall       BETWEEN 1 AND 5),
        rating_cleanliness   DECIMAL(3,1)          CHECK (rating_cleanliness   BETWEEN 1 AND 5),
        rating_accuracy      DECIMAL(3,1)          CHECK (rating_accuracy      BETWEEN 1 AND 5),
        rating_communication DECIMAL(3,1)          CHECK (rating_communication BETWEEN 1 AND 5),
        rating_location      DECIMAL(3,1)          CHECK (rating_location      BETWEEN 1 AND 5),
        rating_checkin       DECIMAL(3,1)          CHECK (rating_checkin       BETWEEN 1 AND 5),
        rating_value         DECIMAL(3,1)          CHECK (rating_value         BETWEEN 1 AND 5),
        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(house_id, user_id)
      )
    `);
    console.log('house_reviews table created');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
