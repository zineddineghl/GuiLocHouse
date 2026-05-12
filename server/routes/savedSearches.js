const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

// GET — mes recherches sauvegardées
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST — sauvegarder une recherche
router.post('/', authenticate, async (req, res) => {
  try {
    const { label, city, neighborhood, rental_type, max_price, min_bedrooms, min_surface, amenities } = req.body;
    if (!label) return res.status(400).json({ error: 'Un nom est requis' });

    const { rows } = await pool.query(
      `INSERT INTO saved_searches (user_id, label, city, neighborhood, rental_type, max_price, min_bedrooms, min_surface, amenities)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        req.user.id, label,
        city || null, neighborhood || null, rental_type || null,
        max_price ? parseInt(max_price) : null,
        min_bedrooms ? parseInt(min_bedrooms) : null,
        min_surface ? parseInt(min_surface) : null,
        JSON.stringify(amenities || []),
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE — supprimer une recherche
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM saved_searches WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
