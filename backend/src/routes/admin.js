const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { generateBultosExcel } = require('../utils/excel');

const router = express.Router();

router.use(requireAdmin);

const SALT_ROUNDS = 12;

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, plataforma, activo, created_at, updated_at FROM users ORDER BY nombre'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users
router.post('/users', async (req, res) => {
  const { nombre, plataforma, pin } = req.body;
  if (!nombre || !plataforma || !pin) {
    return res.status(400).json({ error: 'nombre, plataforma, and pin are required' });
  }
  try {
    const pin_hash = await bcrypt.hash(String(pin), SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (nombre, plataforma, pin_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, plataforma, activo, created_at, updated_at`,
      [nombre, plataforma, pin_hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, plataforma, pin, activo } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = existing.rows[0];
    let pin_hash = user.pin_hash;
    if (pin != null) {
      pin_hash = await bcrypt.hash(String(pin), SALT_ROUNDS);
    }

    const result = await pool.query(
      `UPDATE users
       SET nombre = $1, plataforma = $2, pin_hash = $3, activo = $4, updated_at = now()
       WHERE id = $5
       RETURNING id, nombre, plataforma, activo, created_at, updated_at`,
      [
        nombre ?? user.nombre,
        plataforma ?? user.plataforma,
        pin_hash,
        activo != null ? activo : user.activo,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/password
router.put('/password', async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'current_password and new_password are required' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'new_password must be at least 6 characters' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE id = $1',
      [req.admin.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    const admin = result.rows[0];
    const match = await bcrypt.compare(current_password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid current password' });
    }
    const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await pool.query(
      'UPDATE admin_users SET password_hash = $1, updated_at = now() WHERE id = $2',
      [password_hash, admin.id]
    );
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/export?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/export', async (req, res) => {
  const { desde, hasta } = req.query;
  if (!desde || !hasta) {
    return res.status(400).json({ error: 'desde and hasta query params are required (YYYY-MM-DD)' });
  }

  // Validate date format
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(desde) || !dateRe.test(hasta)) {
    return res.status(400).json({ error: 'Dates must be in YYYY-MM-DD format' });
  }

  try {
    // Get winning records per barcode within the date range (using Madrid timezone)
    // We use AT TIME ZONE to interpret dates in Madrid timezone
    const result = await pool.query(
      `SELECT b.*, u.nombre
       FROM bultos b
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.fecha_hora_utc >= ($1::date)::timestamptz AT TIME ZONE 'Europe/Madrid'
         AND b.fecha_hora_utc < ($2::date + interval '1 day')::timestamptz AT TIME ZONE 'Europe/Madrid'
       ORDER BY b.fecha_hora_utc ASC`,
      [desde, hasta]
    );

    const buffer = await generateBultosExcel(result.rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bultos_${desde}_${hasta}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
