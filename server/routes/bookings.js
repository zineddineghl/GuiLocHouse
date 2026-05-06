const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

// POST /api/bookings
router.post('/', authenticate, async (req, res) => {
  const { house_id, start_date, end_date, guests, message } = req.body;
  if (!house_id || !start_date || !end_date) return res.status(400).json({ error: 'Champs requis manquants' });
  try {
    const houseResult = await pool.query('SELECT * FROM houses WHERE id = $1', [house_id]);
    if (!houseResult.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    const house = houseResult.rows[0];

    if (house.owner_id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas réserver votre propre annonce' });

    const nights = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    if (nights < 1) return res.status(400).json({ error: 'Dates invalides' });
    const total_price = nights * house.price_per_night;

    const { rows } = await pool.query(`
      INSERT INTO bookings (house_id, renter_id, start_date, end_date, total_price, guests, message)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [house_id, req.user.id, start_date, end_date, total_price, guests || 1, message || null]);

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/bookings/my
router.get('/my', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.*, h.title as house_title, h.city, h.images
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      WHERE b.renter_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/bookings/received
router.get('/received', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.*, h.title as house_title, u.name as renter_name, u.phone as renter_phone
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      JOIN users u ON b.renter_id = u.id
      WHERE h.owner_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/bookings/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'rejected', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  try {
    const { rows } = await pool.query(`
      SELECT b.*, h.owner_id FROM bookings b JOIN houses h ON b.house_id = h.id WHERE b.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Réservation introuvable' });

    const booking = rows[0];
    const isOwner = booking.owner_id === req.user.id;
    const isRenter = booking.renter_id === req.user.id;

    if (!isOwner && !isRenter) return res.status(403).json({ error: 'Accès refusé' });
    if (status === 'cancelled' && !isRenter) return res.status(403).json({ error: 'Seul le locataire peut annuler' });
    if (['confirmed', 'rejected'].includes(status) && !isOwner) return res.status(403).json({ error: 'Seul le propriétaire peut confirmer/rejeter' });

    const { rows: updated } = await pool.query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
