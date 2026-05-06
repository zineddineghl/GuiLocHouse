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
    const { city, type, min_price, max_price, bedrooms, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE h.available = 1';
    const params = [];
    let idx = 1;

    if (city) { where += ` AND h.city ILIKE $${idx++}`; params.push(`%${city}%`); }
    if (type) { where += ` AND h.type = $${idx++}`; params.push(type); }
    if (min_price) { where += ` AND h.price_per_night >= $${idx++}`; params.push(parseInt(min_price)); }
    if (max_price) { where += ` AND h.price_per_night <= $${idx++}`; params.push(parseInt(max_price)); }
    if (bedrooms) { where += ` AND h.bedrooms >= $${idx++}`; params.push(parseInt(bedrooms)); }

    const countResult = await pool.query(`SELECT COUNT(*)::int as total FROM houses h ${where}`, params);
    const { rows } = await pool.query(`
      SELECT h.id, h.title, h.type, h.city, h.neighborhood, h.price_per_night,
             h.bedrooms, h.bathrooms, h.max_guests, h.images, h.available, h.created_at,
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
    const { title, description, type, city, neighborhood, address, price_per_night, bedrooms, bathrooms, max_guests, amenities } = req.body;
    if (!title || !price_per_night || !city) return res.status(400).json({ error: 'Champs requis manquants' });

    const images = (req.files || []).map(f => f.path);
    const amenitiesArr = amenities ? JSON.parse(amenities) : [];

    const { rows } = await pool.query(`
      INSERT INTO houses (owner_id, title, description, type, city, neighborhood, address, price_per_night, bedrooms, bathrooms, max_guests, images, amenities)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [req.user.id, title, description, type || 'apartment', city, neighborhood, address, parseInt(price_per_night), parseInt(bedrooms) || 1, parseInt(bathrooms) || 1, parseInt(max_guests) || 2, JSON.stringify(images), JSON.stringify(amenitiesArr)]);

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
