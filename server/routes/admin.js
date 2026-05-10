const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

// ── STATS ──────────────────────────────────────────────────────────────────────
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const [summary, recent_bookings, recent_users] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM users)::int                                                                          AS total_users,
          (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days')::int                           AS new_users_month,
          (SELECT COUNT(*) FROM houses)::int                                                                         AS total_houses,
          (SELECT COUNT(*) FROM houses WHERE available = 1)::int                                                     AS active_houses,
          (SELECT COUNT(*) FROM bookings)::int                                                                       AS total_bookings,
          (SELECT COUNT(*) FROM bookings WHERE status = 'pending')::int                                              AS pending_bookings,
          (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status = 'confirmed')::bigint                   AS total_revenue,
          (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status = 'confirmed' AND created_at > NOW() - INTERVAL '30 days')::bigint AS month_revenue,
          (SELECT COUNT(*) FROM users WHERE banned = 1)::int                                                        AS banned_users
      `),
      pool.query(`
        SELECT b.id, b.status, b.total_price, h.title AS house_title,
               u1.name AS renter_name, u2.name AS owner_name
        FROM bookings b
        JOIN houses  h  ON b.house_id  = h.id
        JOIN users   u1 ON b.renter_id = u1.id
        JOIN users   u2 ON h.owner_id  = u2.id
        ORDER BY b.created_at DESC LIMIT 5
      `),
      pool.query(`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5`),
    ]);
    res.json({ summary: summary.rows[0], recent_bookings: recent_bookings.rows, recent_users: recent_users.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── USERS ──────────────────────────────────────────────────────────────────────
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, banned } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      where += ` AND (u.name ILIKE $${idx} OR u.email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (role) { where += ` AND u.role = $${idx++}`; params.push(role); }
    if (banned !== undefined && banned !== '') { where += ` AND u.banned = $${idx++}`; params.push(parseInt(banned)); }

    const [count, users] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users u ${where}`, params),
      pool.query(`
        SELECT u.id, u.name, u.email, u.phone, u.role, u.is_admin, u.banned, u.created_at,
               (SELECT COUNT(*) FROM houses   WHERE owner_id  = u.id)::int AS house_count,
               (SELECT COUNT(*) FROM bookings WHERE renter_id = u.id)::int AS booking_count
        FROM users u ${where}
        ORDER BY u.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, parseInt(limit), offset]),
    ]);

    res.json({ users: users.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { banned, is_admin } = req.body;
    const fields = [];
    const params = [];
    let idx = 1;
    if (banned    !== undefined) { fields.push(`banned   = $${idx++}`); params.push(banned); }
    if (is_admin  !== undefined) { fields.push(`is_admin = $${idx++}`); params.push(is_admin); }
    if (!fields.length) return res.status(400).json({ error: 'Rien à mettre à jour' });
    params.push(parseInt(req.params.id));
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, params);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── HOUSES ─────────────────────────────────────────────────────────────────────
router.get('/houses', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type, available } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      where += ` AND (h.title ILIKE $${idx} OR h.city ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (type) { where += ` AND h.type = $${idx++}`; params.push(type); }
    if (available !== undefined && available !== '') { where += ` AND h.available = $${idx++}`; params.push(parseInt(available)); }

    const [count, houses] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM houses h ${where}`, params),
      pool.query(`
        SELECT h.id, h.title, h.city, h.type, h.price_per_night, h.available, h.images, h.created_at,
               u.name AS owner_name, u.email AS owner_email,
               (SELECT COUNT(*) FROM bookings WHERE house_id = h.id)::int AS booking_count
        FROM houses h
        JOIN users u ON h.owner_id = u.id
        ${where}
        ORDER BY h.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, parseInt(limit), offset]),
    ]);

    res.json({ houses: houses.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/houses/:id', authenticateAdmin, async (req, res) => {
  try {
    const { available } = req.body;
    await pool.query('UPDATE houses SET available = $1 WHERE id = $2', [available, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/houses/:id', authenticateAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM houses WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── BOOKINGS ───────────────────────────────────────────────────────────────────
router.get('/bookings', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;

    if (status) { where += ` AND b.status = $${idx++}`; params.push(status); }

    const [count, bookings] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM bookings b ${where}`, params),
      pool.query(`
        SELECT b.id, b.status, b.total_price, b.start_date, b.end_date, b.guests, b.created_at,
               h.title AS house_title, h.city AS house_city,
               u1.name AS renter_name, u1.email AS renter_email,
               u2.name AS owner_name,  u2.email AS owner_email
        FROM bookings b
        JOIN houses h  ON b.house_id  = h.id
        JOIN users  u1 ON b.renter_id = u1.id
        JOIN users  u2 ON h.owner_id  = u2.id
        ${where}
        ORDER BY b.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, parseInt(limit), offset]),
    ]);

    res.json({ bookings: bookings.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/bookings/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
