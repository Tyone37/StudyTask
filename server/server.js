const express = require('express');
const cors = require('cors');
const { getOne, pool } = require('./db');
const { clientOrigin, googleClientId, port } = require('./config');
const { requireAuth } = require('./middleware/auth');
const { mapUser } = require('./utils/mappers');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const todosRoutes = require('./routes/todos.routes');
const notesRoutes = require('./routes/notes.routes');
const deadlinesRoutes = require('./routes/deadlines.routes');

const app = express();

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      message: 'request_completed'
    }));
  });
  next();
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ ok: true, database: 'connected' });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      database: 'unavailable',
      message: error.message
    });
  }
});

app.get('/api/config', (_req, res) => {
  res.json({
    googleClientId,
    googleLoginEnabled: Boolean(googleClientId)
  });
});

app.use('/api/auth', authRoutes);
app.get('/api/me', requireAuth, async (req, res, next) => {
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
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/deadlines', deadlinesRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy API.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: 'Có lỗi xảy ra ở server.',
    detail: process.env.NODE_ENV === 'production' ? undefined : error.message
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`API đang chạy tại http://localhost:${port}`);
  });
}

module.exports = app;
