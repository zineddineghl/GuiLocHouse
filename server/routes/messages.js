const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

// POST /api/messages/conversations — créer ou récupérer une conversation
router.post('/conversations', authenticate, async (req, res) => {
  const { house_id } = req.body;
  if (!house_id) return res.status(400).json({ error: 'house_id requis' });
  try {
    const houseRes = await pool.query('SELECT owner_id FROM houses WHERE id = $1', [house_id]);
    if (!houseRes.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    const owner_id = houseRes.rows[0].owner_id;
    if (owner_id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas vous contacter vous-même' });

    // Upsert conversation
    const { rows } = await pool.query(`
      INSERT INTO conversations (house_id, owner_id, renter_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (house_id, renter_id) DO UPDATE SET house_id = EXCLUDED.house_id
      RETURNING id
    `, [house_id, owner_id, req.user.id]);

    res.json({ id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/messages/conversations — liste mes conversations
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id, c.house_id, c.created_at,
        h.title as house_title, h.images as house_images,
        owner.id as owner_id, owner.name as owner_name,
        renter.id as renter_id, renter.name as renter_name,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND read_at IS NULL)::int as unread
      FROM conversations c
      JOIN users owner ON c.owner_id = owner.id
      JOIN users renter ON c.renter_id = renter.id
      LEFT JOIN houses h ON c.house_id = h.id
      WHERE c.owner_id = $1 OR c.renter_id = $1
      ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/messages/unread — nombre total de messages non lus
router.get('/unread', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE (c.owner_id = $1 OR c.renter_id = $1)
        AND m.sender_id != $1
        AND m.read_at IS NULL
    `, [req.user.id]);
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/messages/conversations/:id — messages d'une conversation
router.get('/conversations/:id', authenticate, async (req, res) => {
  try {
    const convRes = await pool.query(`
      SELECT c.*, h.title as house_title, h.images as house_images,
             owner.name as owner_name, renter.name as renter_name
      FROM conversations c
      JOIN users owner ON c.owner_id = owner.id
      JOIN users renter ON c.renter_id = renter.id
      LEFT JOIN houses h ON c.house_id = h.id
      WHERE c.id = $1
    `, [req.params.id]);
    const conv = convRes.rows[0];
    if (!conv) return res.status(404).json({ error: 'Conversation introuvable' });
    if (conv.owner_id !== req.user.id && conv.renter_id !== req.user.id)
      return res.status(403).json({ error: 'Accès refusé' });

    // Marquer les messages comme lus
    await pool.query(`
      UPDATE messages SET read_at = NOW()
      WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL
    `, [req.params.id, req.user.id]);

    const { rows: msgs } = await pool.query(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [req.params.id]);

    res.json({ conversation: conv, messages: msgs });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/messages/conversations/:id — envoyer un message
router.post('/conversations/:id', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Message vide' });
  try {
    const convRes = await pool.query('SELECT * FROM conversations WHERE id = $1', [req.params.id]);
    const conv = convRes.rows[0];
    if (!conv) return res.status(404).json({ error: 'Conversation introuvable' });
    if (conv.owner_id !== req.user.id && conv.renter_id !== req.user.id)
      return res.status(403).json({ error: 'Accès refusé' });

    const { rows } = await pool.query(`
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES ($1, $2, $3) RETURNING *
    `, [req.params.id, req.user.id, content.trim()]);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
