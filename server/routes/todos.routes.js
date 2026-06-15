const express = require('express');
const { getOne, query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { mapTodo } = require('../utils/mappers');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT * FROM todos WHERE user_id = ? ORDER BY completed ASC, created_at DESC',
      [req.user.id]
    );
    return res.json(rows.map(mapTodo));
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'Vui lòng nhập tên công việc.' });
    }

    const result = await query(
      'INSERT INTO todos (user_id, title) VALUES (?, ?)',
      [req.user.id, title]
    );
    const row = await getOne('SELECT * FROM todos WHERE id = ? AND user_id = ?', [
      result.insertId,
      req.user.id
    ]);

    return res.status(201).json(mapTodo(row));
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await getOne('SELECT * FROM todos WHERE id = ? AND user_id = ?', [
      id,
      req.user.id
    ]);

    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy công việc.' });
    }

    const title = req.body.title === undefined ? existing.title : String(req.body.title).trim();
    const completed = req.body.completed === undefined
      ? Boolean(existing.completed)
      : Boolean(req.body.completed);

    if (!title) {
      return res.status(400).json({ message: 'Tên công việc không được để trống.' });
    }

    await query(
      'UPDATE todos SET title = ?, completed = ? WHERE id = ? AND user_id = ?',
      [title, completed, id, req.user.id]
    );

    const row = await getOne('SELECT * FROM todos WHERE id = ? AND user_id = ?', [
      id,
      req.user.id
    ]);
    return res.json(mapTodo(row));
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM todos WHERE id = ? AND user_id = ?', [
      Number(req.params.id),
      req.user.id
    ]);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

