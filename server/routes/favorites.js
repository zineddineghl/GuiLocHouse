const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/favorites/ids — liste des IDs favoris de l'utilisateur
router.get('/ids', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT house_id FROM favorites WHERE user_id = $1',
    [req.user.id]
  );
  res.json(rows.map(r => r.house_id));
});

// GET /api/favorites — liste complète des maisons favorites
router.get('/', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT h.id, h.title, h.type, h.rental_type, h.city, h.neighborhood,
            h.price_per_night, h.bedrooms, h.beds, h.max_guests, h.images
     FROM favorites f
     JOIN houses h ON h.id = f.house_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// POST /api/favorites/:house_id — toggle favori
router.post('/:house_id', authenticate, async (req, res) => {
  const houseId = parseInt(req.params.house_id);
  const { rows } = await pool.query(
    'SELECT id FROM favorites WHERE user_id = $1 AND house_id = $2',
    [req.user.id, houseId]
  );
  if (rows.length > 0) {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND house_id = $2', [req.user.id, houseId]);
    res.json({ favorited: false });
  } else {
    await pool.query('INSERT INTO favorites (user_id, house_id) VALUES ($1, $2)', [req.user.id, houseId]);
    res.json({ favorited: true });
  }
});

module.exports = router;
