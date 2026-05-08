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
      check_in, check_out, page = 1, limit = 12
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
    if (check_in && check_out) {
      where += `
        AND h.id NOT IN (
          SELECT house_id FROM bookings
          WHERE status IN ('pending', 'confirmed')
          AND NOT (end_date < $${idx++} OR start_date > $${idx++})
        )
      `;
      params.push(check_in, check_out);
    }

    const countResult = await pool.query(`SELECT COUNT(*)::int as total FROM houses h ${where}`, params);
    const { rows } = await pool.query(`
      SELECT h.id, h.title, h.type, h.rental_type, h.city, h.neighborhood,
             h.price_per_night, h.bedrooms, h.beds, h.bathrooms, h.max_guests,
             h.images, h.amenities, h.pets_allowed, h.available, h.created_at,
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

// POST /api/houses
router.post('/', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, type, rental_type, city, neighborhood, address, price_per_night, bedrooms, beds, bathrooms, max_guests, pets_allowed, amenities, min_nights, max_nights } = req.body;
    if (!title || !price_per_night || !city) return res.status(400).json({ error: 'Champs requis manquants' });

    const images = (req.files || []).map(f => f.path);
    const amenitiesArr = amenities ? JSON.parse(amenities) : [];

    const { rows } = await pool.query(`
      INSERT INTO houses (owner_id, title, description, type, rental_type, city, neighborhood, address, price_per_night, bedrooms, beds, bathrooms, max_guests, pets_allowed, images, amenities, min_nights, max_nights)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
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
    ]);

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

module.exports = router;
