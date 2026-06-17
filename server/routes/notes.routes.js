const express = require('express');
const { getOne, query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { mapNote } = require('../utils/mappers');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json(rows.map(mapNote));
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const content = String(req.body.content || '').trim();

    if (!title) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề ghi chú.' });
    }

    const result = await query(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title, content]
    );
    const row = await getOne('SELECT * FROM notes WHERE id = ? AND user_id = ?', [
      result.insertId,
      req.user.id
    ]);

    return res.status(201).json(mapNote(row));
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await getOne('SELECT * FROM notes WHERE id = ? AND user_id = ?', [
      id,
      req.user.id
    ]);

    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy ghi chú.' });
    }

    const title = req.body.title === undefined
      ? existing.title
      : String(req.body.title || '').trim();
    const content = req.body.content === undefined
      ? existing.content || ''
      : String(req.body.content || '').trim();

    if (!title) {
      return res.status(400).json({ message: 'Tiêu đề ghi chú không được để trống.' });
    }

    await query(
      'UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?',
      [title, content, id, req.user.id]
    );

    const row = await getOne('SELECT * FROM notes WHERE id = ? AND user_id = ?', [
      id,
      req.user.id
    ]);
    return res.json(mapNote(row));
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM notes WHERE id = ? AND user_id = ?', [
      Number(req.params.id),
      req.user.id
    ]);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
