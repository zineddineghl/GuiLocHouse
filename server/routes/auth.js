const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
const idStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'guilochouse-ids', allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'], resource_type: 'auto' },
});
const uploadId = multer({ storage: idStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || 'guilochouse_secret_2024';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Champs requis manquants' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email déjà utilisé' });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, role, is_admin',
      [name, email, hash, phone || null]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Champs requis manquants' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    if (user.banned) return res.status(403).json({ error: 'Compte suspendu' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...userData } = user;
    res.json({ user: userData, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, role, is_admin, is_verified, verify_requested, id_document_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/verify-request — upload pièce d'identité
router.post('/verify-request', authenticate, uploadId.single('id_document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun document fourni' });
    const url = req.file.path;
    await pool.query(
      'UPDATE users SET id_document_url = $1, verify_requested = TRUE WHERE id = $2',
      [url, req.user.id]
    );
    res.json({ ok: true, message: 'Demande de vérification envoyée. Un administrateur va valider votre compte.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  const { name, phone } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3 RETURNING id, name, email, phone, role, is_admin',
      [name, phone, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Champs requis manquants' });
  try {
    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/auth/me
router.delete('/me', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
