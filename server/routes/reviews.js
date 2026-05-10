const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

// helper: compute averages from rows
function computeAverages(rows) {
  if (!rows.length) return null;
  const avg = (key) => {
    const vals = rows.map(r => parseFloat(r[key] || r.rating_overall)).filter(Boolean);
    return parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2));
  };
  return {
    overall:       avg('rating_overall'),
    cleanliness:   avg('rating_cleanliness'),
    accuracy:      avg('rating_accuracy'),
    communication: avg('rating_communication'),
    location:      avg('rating_location'),
    checkin:       avg('rating_checkin'),
    value:         avg('rating_value'),
  };
}

// GET /api/reviews/house/:houseId — public
router.get('/house/:houseId', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, u.name AS user_name
      FROM house_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.house_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.houseId]);

    res.json({ reviews: rows, averages: computeAverages(rows), total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/reviews/house/:houseId — authenticated
router.post('/house/:houseId', authenticate, async (req, res) => {
  const { houseId } = req.params;
  const {
    comment, rating_overall,
    rating_cleanliness, rating_accuracy, rating_communication,
    rating_location, rating_checkin, rating_value,
  } = req.body;

  if (!comment?.trim()) return res.status(400).json({ error: 'Le commentaire est requis' });
  if (!rating_overall)   return res.status(400).json({ error: 'La note globale est requise' });

  try {
    const house = await pool.query('SELECT owner_id FROM houses WHERE id = $1', [houseId]);
    if (!house.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    if (house.rows[0].owner_id === req.user.id)
      return res.status(400).json({ error: 'Vous ne pouvez pas noter votre propre annonce' });

    const existing = await pool.query(
      'SELECT id FROM house_reviews WHERE house_id = $1 AND user_id = $2',
      [houseId, req.user.id]
    );
    if (existing.rows.length)
      return res.status(409).json({ error: 'Vous avez déjà laissé un avis pour cette annonce' });

    const fallback = (val) => val || rating_overall;
    const { rows } = await pool.query(`
      INSERT INTO house_reviews
        (house_id, user_id, comment, rating_overall, rating_cleanliness, rating_accuracy,
         rating_communication, rating_location, rating_checkin, rating_value)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      houseId, req.user.id, comment.trim(), rating_overall,
      fallback(rating_cleanliness), fallback(rating_accuracy),
      fallback(rating_communication), fallback(rating_location),
      fallback(rating_checkin), fallback(rating_value),
    ]);

    const user = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    res.json({ ...rows[0], user_name: user.rows[0].name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/reviews/:id — own review or admin
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT user_id FROM house_reviews WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Avis introuvable' });
    if (rows[0].user_id !== req.user.id && !req.user.is_admin)
      return res.status(403).json({ error: 'Non autorisé' });
    await pool.query('DELETE FROM house_reviews WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
