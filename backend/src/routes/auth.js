const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

function signOperarioToken(user) {
  return jwt.sign(
    { id: user.id, nombre: user.nombre, plataforma: user.plataforma, role: 'operario' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_OPERARIO_EXPIRES || '12h' }
  );
}

function signAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, username: admin.username, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ADMIN_EXPIRES || '12h' }
  );
}

// POST /api/auth/login-operario
router.post('/login-operario', async (req, res) => {
  const { plataforma, pin } = req.body;
  if (!plataforma || !pin) {
    return res.status(400).json({ error: 'plataforma and pin are required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE plataforma = $1 AND activo = true',
      [plataforma]
    );
    // Find matching PIN among active users on the platform
    let matchedUser = null;
    for (const user of result.rows) {
      const match = await bcrypt.compare(String(pin), user.pin_hash);
      if (match) {
        matchedUser = user;
        break;
      }
    }
    if (!matchedUser) {
      return res.status(401).json({ error: 'Invalid platform or PIN' });
    }
    const token = signOperarioToken(matchedUser);
    return res.json({
      token,
      user: {
        id: matchedUser.id,
        nombre: matchedUser.nombre,
        plataforma: matchedUser.plataforma,
        activo: matchedUser.activo,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login-admin
router.post('/login-admin', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );
    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signAdminToken(admin);
    return res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Only refresh if token expires within 2 hours
    const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 2 * 60 * 60) {
      return res.json({ token, refreshed: false });
    }
    let newToken;
    if (payload.role === 'operario') {
      newToken = jwt.sign(
        { id: payload.id, nombre: payload.nombre, plataforma: payload.plataforma, role: 'operario' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_OPERARIO_EXPIRES || '12h' }
      );
    } else if (payload.role === 'admin') {
      newToken = jwt.sign(
        { id: payload.id, username: payload.username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ADMIN_EXPIRES || '12h' }
      );
    } else {
      return res.status(400).json({ error: 'Unknown token role' });
    }
    return res.json({ token: newToken, refreshed: true });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
