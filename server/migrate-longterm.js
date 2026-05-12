const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    // Houses — colonnes long séjour
    await client.query(`
      ALTER TABLE houses
        ADD COLUMN IF NOT EXISTS price_per_month  INTEGER,
        ADD COLUMN IF NOT EXISTS caution_amount   INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS available_from   DATE,
        ADD COLUMN IF NOT EXISTS surface_house    INTEGER,
        ADD COLUMN IF NOT EXISTS surface_land     INTEGER,
        ADD COLUMN IF NOT EXISTS views_count      INTEGER DEFAULT 0
    `);

    // Copier l'ancien prix nuitée → prix mensuel pour les annonces existantes
    await client.query(`
      UPDATE houses SET price_per_month = price_per_night WHERE price_per_month IS NULL
    `);

    // Users — vérification d'identité
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_verified       BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS id_document_url   TEXT,
        ADD COLUMN IF NOT EXISTS verify_requested  BOOLEAN DEFAULT FALSE
    `);

    // Bookings — durée en mois
    await client.query(`
      ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 1
    `);

    // Contrats de bail générés
    await client.query(`
      CREATE TABLE IF NOT EXISTS lease_contracts (
        id           SERIAL PRIMARY KEY,
        booking_id   INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(booking_id)
      )
    `);

    // Alertes email — recherches sauvegardées
  await client.query(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
      label         VARCHAR(255),
      city          VARCHAR(255),
      neighborhood  VARCHAR(255),
      rental_type   VARCHAR(50),
      max_price     INTEGER,
      min_bedrooms  INTEGER,
      min_surface   INTEGER,
      amenities     JSONB DEFAULT '[]',
      created_at    TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('Migration long-term OK');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
