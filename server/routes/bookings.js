const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const { generateLeasePDF } = require('../utils/generateContract');
const { Resend } = require('resend');

async function sendRejectionEmail(to, renterName, houseTitle) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: 'GuiLocHouse <noreply@guilochouse.com>',
      to,
      subject: `Logement non disponible — ${houseTitle}`,
      html: `
        <p>Bonjour ${renterName},</p>
        <p>Nous vous informons que votre demande de location pour <strong>${houseTitle}</strong> n'a pas pu être retenue.</p>
        <p>Le propriétaire a accepté une autre candidature pour cette période.</p>
        <p>D'autres logements sont disponibles sur <a href="https://www.guilochouse.com">GuiLocHouse</a>.</p>
        <p>Cordialement,<br/>L'équipe GuiLocHouse</p>
      `,
    });
  } catch (err) {
    console.error('Email rejection error:', err);
  }
}

// POST /api/bookings
router.post('/', authenticate, async (req, res) => {
  const { house_id, start_date, duration_months, guests, message } = req.body;
  if (!house_id || !start_date || !duration_months) return res.status(400).json({ error: 'Champs requis manquants' });

  const months = parseInt(duration_months);
  if (months < 1) return res.status(400).json({ error: 'Durée minimale : 1 mois' });

  try {
    // Vérifier que le locataire est vérifié
    const userResult = await pool.query('SELECT is_verified FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows[0]?.is_verified) {
      return res.status(403).json({ error: 'Votre compte doit être vérifié pour effectuer une réservation. Rendez-vous dans votre profil.' });
    }

    const houseResult = await pool.query('SELECT * FROM houses WHERE id = $1', [house_id]);
    if (!houseResult.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    const house = houseResult.rows[0];

    if (house.owner_id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas réserver votre propre annonce' });
    if (!house.available) return res.status(400).json({ error: 'Ce logement n\'est plus disponible' });

    // Calculer la date de fin
    const start = new Date(start_date);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    const end_date = end.toISOString().split('T')[0];

    // Vérifier qu'il n'y a pas de réservation confirmée qui chevauche
    const conflict = await pool.query(`
      SELECT 1 FROM bookings
      WHERE house_id = $1 AND status = 'confirmed'
      AND NOT (end_date <= $2 OR start_date >= $3)
    `, [house_id, start_date, end_date]);
    if (conflict.rows.length > 0) return res.status(409).json({ error: 'Ce logement est déjà réservé pour cette période' });

    const total_price = (house.price_per_month || house.price_per_night) * months;

    const { rows } = await pool.query(`
      INSERT INTO bookings (house_id, renter_id, start_date, end_date, duration_months, total_price, guests, message)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [house_id, req.user.id, start_date, end_date, months, total_price, guests || 1, message || null]);

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
      SELECT b.*, h.title as house_title, h.city, h.images, h.price_per_month,
             lc.id as contract_id
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      LEFT JOIN lease_contracts lc ON lc.booking_id = b.id
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
      SELECT b.*, h.title as house_title, u.name as renter_name, u.phone as renter_phone,
             u.email as renter_email, lc.id as contract_id
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      JOIN users u ON b.renter_id = u.id
      LEFT JOIN lease_contracts lc ON lc.booking_id = b.id
      WHERE h.owner_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/bookings/:id/contract — génère et stream le PDF
router.get('/:id/contract', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.*,
             h.title, h.type, h.city, h.neighborhood, h.address, h.bedrooms,
             h.bathrooms, h.max_guests, h.price_per_month, h.price_per_night,
             h.caution_amount, h.smoking_allowed, h.pets_allowed, h.extra_rules,
             h.owner_id,
             u_owner.name  as owner_name,  u_owner.email  as owner_email,  u_owner.phone  as owner_phone,
             u_tenant.name as tenant_name, u_tenant.email as tenant_email, u_tenant.phone as tenant_phone
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      JOIN users u_owner  ON h.owner_id   = u_owner.id
      JOIN users u_tenant ON b.renter_id  = u_tenant.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (!rows[0]) return res.status(404).json({ error: 'Réservation introuvable' });
    const data = rows[0];

    // Seuls le propriétaire et le locataire peuvent télécharger
    if (req.user.id !== data.owner_id && req.user.id !== data.renter_id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (data.status !== 'confirmed') {
      return res.status(400).json({ error: 'Le contrat n\'est disponible que pour les réservations confirmées' });
    }

    // Enregistrer que le contrat a été généré (idempotent)
    await pool.query(
      'INSERT INTO lease_contracts (booking_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [data.id]
    );

    generateLeasePDF({
      booking: {
        id: data.id,
        start_date: data.start_date,
        end_date: data.end_date,
        duration_months: data.duration_months,
        total_price: data.total_price,
      },
      house: {
        title: data.title,
        type: data.type,
        city: data.city,
        neighborhood: data.neighborhood,
        address: data.address,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        max_guests: data.max_guests,
        price_per_month: data.price_per_month || data.price_per_night,
        caution_amount: data.caution_amount,
        smoking_allowed: data.smoking_allowed,
        pets_allowed: data.pets_allowed,
        extra_rules: data.extra_rules,
      },
      owner:  { name: data.owner_name,  email: data.owner_email,  phone: data.owner_phone },
      tenant: { name: data.tenant_name, email: data.tenant_email, phone: data.tenant_phone },
    }, res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/bookings/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'rejected', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  try {
    const { rows } = await pool.query(`
      SELECT b.*, h.owner_id, h.title as house_title FROM bookings b JOIN houses h ON b.house_id = h.id WHERE b.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Réservation introuvable' });

    const booking = rows[0];
    const isOwner = booking.owner_id === req.user.id;
    const isRenter = booking.renter_id === req.user.id;

    let isCohost = false;
    if (!isOwner && ['confirmed', 'rejected'].includes(status)) {
      const { rows: ch } = await pool.query(
        'SELECT 1 FROM house_cohosts WHERE house_id = $1 AND user_id = $2',
        [booking.house_id, req.user.id]
      );
      isCohost = ch.length > 0;
    }

    if (!isOwner && !isRenter && !isCohost) return res.status(403).json({ error: 'Accès refusé' });
    if (status === 'cancelled' && !isRenter) return res.status(403).json({ error: 'Seul le locataire peut annuler' });
    if (['confirmed', 'rejected'].includes(status) && !isOwner && !isCohost) return res.status(403).json({ error: 'Seul le propriétaire peut confirmer/rejeter' });

    const { rows: updated } = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    // Si confirmé : rejeter les autres demandes pending pour la même maison qui chevauchent
    if (status === 'confirmed') {
      const { rows: toReject } = await pool.query(`
        SELECT b.id, u.email, u.name FROM bookings b
        JOIN users u ON b.renter_id = u.id
        WHERE b.house_id = $1 AND b.id != $2 AND b.status = 'pending'
        AND NOT (b.end_date <= $3 OR b.start_date >= $4)
      `, [booking.house_id, booking.id, booking.start_date, booking.end_date]);

      if (toReject.length > 0) {
        await pool.query(
          `UPDATE bookings SET status = 'rejected' WHERE id = ANY($1)`,
          [toReject.map(b => b.id)]
        );
        // Envoyer emails de rejet
        for (const b of toReject) {
          await sendRejectionEmail(b.email, b.name, booking.house_title);
        }
      }
    }

    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
