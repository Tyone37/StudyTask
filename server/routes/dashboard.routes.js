const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { mapDeadline, mapNote, mapTodo } = require('../utils/mappers');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [todoStats] = await query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completed
       FROM todos
       WHERE user_id = ?`,
      [userId]
    );
    const [noteStats] = await query('SELECT COUNT(*) AS total FROM notes WHERE user_id = ?', [userId]);
    const [deadlineStats] = await query(
      `SELECT COUNT(*) AS total
       FROM deadlines
       WHERE user_id = ? AND done = 0 AND due_date >= CURDATE()`,
      [userId]
    );

    const recentTodos = await query(
      'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [userId]
    );
    const recentNotes = await query(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [userId]
    );
    const upcomingDeadlines = await query(
      `SELECT * FROM deadlines
       WHERE user_id = ? AND done = 0
       ORDER BY due_date ASC
       LIMIT 5`,
      [userId]
    );

    const totalTodos = Number(todoStats.total || 0);
    const completedTodos = Number(todoStats.completed || 0);

    return res.json({
      counts: {
        todos: totalTodos,
        incompleteTodos: totalTodos - completedTodos,
        notes: Number(noteStats.total || 0),
        upcomingDeadlines: Number(deadlineStats.total || 0),
        completionPercent: totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100)
      },
      recentTodos: recentTodos.map(mapTodo),
      recentNotes: recentNotes.map(mapNote),
      upcomingDeadlines: upcomingDeadlines.map(mapDeadline)
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

