const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'guilochouse', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/houses
router.get('/', async (req, res) => {
  try {
    const {
      city, neighborhood, rental_type, min_price, max_price,
      bedrooms, beds, guests, pets_allowed, amenities,
      check_in, check_out, page = 1, limit = 12,
      sw_lat, sw_lng, ne_lat, ne_lng,
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE h.available = 1';
    const params = [];
    let idx = 1;

    if (city) { where += ` AND h.city ILIKE $${idx++}`; params.push(`%${city}%`); }
    if (neighborhood) { where += ` AND h.neighborhood ILIKE $${idx++}`; params.push(`%${neighborhood}%`); }
    if (rental_type) { where += ` AND h.rental_type = $${idx++}`; params.push(rental_type); }
    if (min_price) { where += ` AND h.price_per_night >= $${idx++}`; params.push(parseInt(min_price)); }
    if (max_price) { where += ` AND h.price_per_night <= $${idx++}`; params.push(parseInt(max_price)); }
    if (bedrooms) { where += ` AND h.bedrooms >= $${idx++}`; params.push(parseInt(bedrooms)); }
    if (beds) { where += ` AND h.beds >= $${idx++}`; params.push(parseInt(beds)); }
    if (guests) { where += ` AND h.max_guests >= $${idx++}`; params.push(parseInt(guests)); }
    if (pets_allowed === 'true') { where += ` AND h.pets_allowed = 1`; }
    if (amenities) {
      const amenitiesArr = Array.isArray(amenities) ? amenities : [amenities];
      where += ` AND h.amenities @> $${idx++}::jsonb`;
      params.push(JSON.stringify(amenitiesArr));
    }
    if (sw_lat && ne_lat && sw_lng && ne_lng) {
      where += ` AND h.latitude  BETWEEN $${idx++} AND $${idx++}`;
      where += ` AND h.longitude BETWEEN $${idx++} AND $${idx++}`;
      params.push(parseFloat(sw_lat), parseFloat(ne_lat), parseFloat(sw_lng), parseFloat(ne_lng));
    }

    if (check_in && check_out) {
      where += `
        AND h.id NOT IN (
          SELECT house_id FROM bookings
          WHERE status IN ('pending', 'confirmed')
          AND NOT (end_date < $${idx++} OR start_date > $${idx++})
        )
        AND h.id NOT IN (
          SELECT house_id FROM house_blocked_dates
          WHERE NOT (end_date < $${idx++} OR start_date > $${idx++})
        )
      `;
      params.push(check_in, check_out, check_in, check_out);
    }

    const countResult = await pool.query(`SELECT COUNT(*)::int as total FROM houses h ${where}`, params);
    const { rows } = await pool.query(`
      SELECT h.id, h.title, h.type, h.rental_type, h.city, h.neighborhood,
             h.price_per_night, h.bedrooms, h.beds, h.bathrooms, h.max_guests,
             h.images, h.amenities, h.pets_allowed, h.available, h.created_at,
             h.latitude, h.longitude, h.discount_weekly, h.discount_monthly,
             h.check_in_time, h.check_out_time, h.smoking_allowed, h.extra_rules,
             h.cancellation_policy,
             u.name as owner_name, u.id as owner_id
      FROM houses h
      JOIN users u ON h.owner_id = u.id
      ${where}
      ORDER BY h.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, parseInt(limit), offset]);

    res.json({ houses: rows, total: countResult.rows[0].total, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/houses/my
router.get('/my', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, type, rental_type, city, neighborhood, price_per_night,
              bedrooms, beds, max_guests, images, available, created_at
       FROM houses WHERE owner_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/houses/:id/toggle
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM houses WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    const newAvailable = rows[0].available ? 0 : 1;
    await pool.query('UPDATE houses SET available = $1 WHERE id = $2', [newAvailable, req.params.id]);
    res.json({ available: newAvailable });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/houses/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT h.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, u.id as owner_id
      FROM houses h
      JOIN users u ON h.owner_id = u.id
      WHERE h.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const CITY_COORDS = {
  'conakry':      [9.6412,  -13.5784],
  'kindia':       [10.0549, -12.8672],
  'labé':         [11.3181, -12.2845],
  'labe':         [11.3181, -12.2845],
  'kankan':       [10.3836, -9.3060],
  'nzérékoré':   [7.7561,  -8.8204],
  'nzerekore':    [7.7561,  -8.8204],
  'mamou':        [10.3741, -12.0827],
  'boké':         [10.9317, -14.2895],
  'boke':         [10.9317, -14.2895],
  'guéckédou':   [8.5543,  -10.1348],
  'gueckédou':    [8.5543,  -10.1348],
  'macenta':      [8.5500,  -9.4667],
  'kissidougou':  [9.1853,  -10.0806],
  'dalaba':       [10.6897, -12.2551],
  'siguiri':      [11.4167, -9.1667],
  'faranah':      [10.0361, -10.7458],
  'télimélé':    [10.9083, -13.0333],
  'telimele':     [10.9083, -13.0333],
  'pita':         [11.0667, -12.4000],
  'forécariah':  [9.4333,  -13.0833],
  'forecariah':   [9.4333,  -13.0833],
  'coyah':        [9.7000,  -13.3833],
  'fria':         [10.3667, -13.5500],
  'dubréka':     [9.7889,  -13.5142],
  'dubreka':      [9.7889,  -13.5142],
  'kérouané':    [9.2700,  -9.0183],
  'kerouane':     [9.2700,  -9.0183],
};

// POST /api/houses
router.post('/', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, type, rental_type, city, neighborhood, address, price_per_night, bedrooms, beds, bathrooms, max_guests, pets_allowed, amenities, min_nights, max_nights, latitude, longitude, discount_weekly, discount_monthly, check_in_time, check_out_time, smoking_allowed, extra_rules, cancellation_policy } = req.body;
    if (!title || !price_per_night || !city) return res.status(400).json({ error: 'Champs requis manquants' });

    const images = (req.files || []).map(f => f.path);
    const amenitiesArr = amenities ? JSON.parse(amenities) : [];
    const validPolicies = ['flexible', 'moderate', 'strict'];
    const policy = validPolicies.includes(cancellation_policy) ? cancellation_policy : 'flexible';

    const { rows } = await pool.query(`
      INSERT INTO houses (owner_id, title, description, type, rental_type, city, neighborhood, address, price_per_night, bedrooms, beds, bathrooms, max_guests, pets_allowed, images, amenities, min_nights, max_nights, discount_weekly, discount_monthly, check_in_time, check_out_time, smoking_allowed, extra_rules, cancellation_policy)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      RETURNING *
    `, [
      req.user.id, title, description,
      type || 'apartment', rental_type || 'entire',
      city, neighborhood, address,
      parseInt(price_per_night),
      parseInt(bedrooms) || 1, parseInt(beds) || 1, parseInt(bathrooms) || 1,
      parseInt(max_guests) || 2,
      pets_allowed === 'true' ? 1 : 0,
      JSON.stringify(images), JSON.stringify(amenitiesArr),
      min_nights ? parseInt(min_nights) : 1,
      max_nights ? parseInt(max_nights) : null,
      parseInt(discount_weekly) || 0,
      parseInt(discount_monthly) || 0,
      check_in_time || null,
      check_out_time || null,
      smoking_allowed === 'true',
      extra_rules || null,
      policy,
    ]);

    // Use exact coords from client, fallback to city-level coords
    let lat = parseFloat(latitude);
    let lng = parseFloat(longitude);
    if (!lat || !lng) {
      const cityKey = Object.keys(CITY_COORDS).find(k => city.toLowerCase().includes(k));
      [lat, lng] = CITY_COORDS[cityKey] || [9.6412, -13.5784];
    }
    await pool.query(
      `UPDATE houses SET latitude = $1, longitude = $2 WHERE id = $3`,
      [lat, lng, rows[0].id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/houses/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM houses WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    if (rows[0].owner_id !== req.user.id && !req.user.is_admin) return res.status(403).json({ error: 'Accès refusé' });
    await pool.query('DELETE FROM houses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/houses/:id/availability — booked + blocked ranges
router.get('/:id/availability', async (req, res) => {
  try {
    const [bookings, blocked] = await Promise.all([
      pool.query(`SELECT start_date, end_date, 'booked' as type FROM bookings WHERE house_id = $1 AND status IN ('pending','confirmed')`, [req.params.id]),
      pool.query(`SELECT id, start_date, end_date, 'blocked' as type FROM house_blocked_dates WHERE house_id = $1`, [req.params.id]),
    ]);
    res.json({ ranges: [...bookings.rows, ...blocked.rows] });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/houses/:id/blocked-dates — pour le propriétaire
router.get('/:id/blocked-dates', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, start_date, end_date FROM house_blocked_dates WHERE house_id = $1 ORDER BY start_date', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/houses/:id/blocked-dates
router.post('/:id/blocked-dates', authenticate, async (req, res) => {
  try {
    const house = await pool.query('SELECT owner_id FROM houses WHERE id = $1', [req.params.id]);
    if (!house.rows[0] || house.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    const { start_date, end_date } = req.body;
    const { rows } = await pool.query('INSERT INTO house_blocked_dates (house_id, start_date, end_date) VALUES ($1,$2,$3) RETURNING *', [req.params.id, start_date, end_date]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/houses/:id/blocked-dates/:blockId
router.delete('/:id/blocked-dates/:blockId', authenticate, async (req, res) => {
  try {
    const house = await pool.query('SELECT owner_id FROM houses WHERE id = $1', [req.params.id]);
    if (!house.rows[0] || house.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    await pool.query('DELETE FROM house_blocked_dates WHERE id = $1 AND house_id = $2', [req.params.blockId, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;
