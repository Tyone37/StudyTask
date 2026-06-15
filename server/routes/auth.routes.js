const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, query } = require('../db');
const { jwtSecret } = require('../config');
const { requireAuth } = require('../middleware/auth');
const { verifyGoogleIdToken } = require('../services/google-auth.service');
const { mapUser } = require('../utils/mappers');

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { email: user.email },
    jwtSecret,
    {
      subject: String(user.id),
      expiresIn: '7d'
    }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!fullName || !email || password.length < 6) {
      return res.status(400).json({
        message: 'Vui lòng nhập tên, email và mật khẩu ít nhất 6 ký tự.'
      });
    }

    const existing = await getOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ message: 'Email này đã được đăng ký.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [fullName, email, passwordHash]
    );

    const row = await getOne('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = mapUser(row);

    return res.status(201).json({
      token: createToken(user),
      user
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const row = await getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!row || !row.password_hash) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const user = mapUser(row);
    return res.json({
      token: createToken(user),
      user
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const identity = await verifyGoogleIdToken(req.body.idToken);
    let row = await getOne('SELECT * FROM users WHERE google_sub = ?', [identity.googleSub]);

    if (!row) {
      const existingByEmail = await getOne('SELECT * FROM users WHERE email = ?', [identity.email]);

      if (existingByEmail && existingByEmail.google_sub && existingByEmail.google_sub !== identity.googleSub) {
        return res.status(409).json({
          message: 'Email is already linked to another Google account.'
        });
      }

      if (existingByEmail) {
        const provider = existingByEmail.password_hash ? 'both' : 'google';
        await query(
          `UPDATE users
           SET google_sub = ?, auth_provider = ?, avatar_url = ?, full_name = ?
           WHERE id = ?`,
          [
            identity.googleSub,
            provider,
            identity.avatarUrl,
            identity.fullName || existingByEmail.full_name,
            existingByEmail.id
          ]
        );
        row = await getOne('SELECT * FROM users WHERE id = ?', [existingByEmail.id]);
      } else {
        const result = await query(
          `INSERT INTO users (full_name, email, password_hash, google_sub, auth_provider, avatar_url)
           VALUES (?, ?, NULL, ?, 'google', ?)`,
          [identity.fullName, identity.email, identity.googleSub, identity.avatarUrl]
        );
        row = await getOne('SELECT * FROM users WHERE id = ?', [result.insertId]);
      }
    } else {
      const emailOwner = await getOne('SELECT id FROM users WHERE email = ? AND id <> ?', [
        identity.email,
        row.id
      ]);

      if (emailOwner) {
        return res.status(409).json({
          message: 'Email is already used by another local account.'
        });
      }

      await query(
        `UPDATE users
         SET full_name = ?, email = ?, avatar_url = ?
         WHERE id = ?`,
        [identity.fullName || row.full_name, identity.email, identity.avatarUrl, row.id]
      );
      row = await getOne('SELECT * FROM users WHERE id = ?', [row.id]);
    }

    const user = mapUser(row);
    return res.json({
      token: createToken(user),
      user
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const row = await getOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!row) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    return res.json(mapUser(row));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
