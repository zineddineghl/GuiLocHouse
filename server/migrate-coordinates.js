const pool = require('./db');

const CITY_COORDS = {
  'Conakry':    [9.6412,  -13.5784],
  'Kindia':     [10.0549, -12.8672],
  'Labé':       [11.3181, -12.2845],
  'Kankan':     [10.3836, -9.3060],
  'Nzérékoré':  [7.7561,  -8.8204],
  'Mamou':      [10.3741, -12.0827],
  'Boké':       [10.9317, -14.2895],
};

async function run() {
  await pool.query(`
    ALTER TABLE houses
      ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10,7),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7)
  `);
  console.log('Columns added (or already exist).');

  for (const [city, [lat, lng]] of Object.entries(CITY_COORDS)) {
    const { rowCount } = await pool.query(`
      UPDATE houses
      SET
        latitude  = $1 + (RANDOM() - 0.5) * 0.04,
        longitude = $2 + (RANDOM() - 0.5) * 0.04
      WHERE city ILIKE $3 AND latitude IS NULL
    `, [lat, lng, `%${city}%`]);
    console.log(`  ${city}: ${rowCount} house(s) updated`);
  }

  console.log('Migration done!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
