const express = require('express');
const { getOne, query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { mapDeadline } = require('../utils/mappers');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT * FROM deadlines WHERE user_id = ? ORDER BY done ASC, due_date ASC',
      [req.user.id]
    );
    return res.json(rows.map(mapDeadline));
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const dueDate = String(req.body.dueDate || '').trim();

    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Vui lòng nhập tên và ngày deadline.' });
    }

    const result = await query(
      'INSERT INTO deadlines (user_id, title, due_date) VALUES (?, ?, ?)',
      [req.user.id, title, dueDate]
    );
    const row = await getOne('SELECT * FROM deadlines WHERE id = ? AND user_id = ?', [
      result.insertId,
      req.user.id
    ]);

    return res.status(201).json(mapDeadline(row));
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await getOne('SELECT * FROM deadlines WHERE id = ? AND user_id = ?', [
      id,
      req.user.id
    ]);

    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy deadline.' });
    }

    const done = req.body.done === undefined ? Boolean(existing.done) : Boolean(req.body.done);
    await query('UPDATE deadlines SET done = ? WHERE id = ? AND user_id = ?', [
      done,
      id,
      req.user.id
    ]);

    const row = await getOne('SELECT * FROM deadlines WHERE id = ? AND user_id = ?', [
      id,
      req.user.id
    ]);
    return res.json(mapDeadline(row));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

