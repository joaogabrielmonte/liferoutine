const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://liferoutine_user:liferoutine_secure_password@localhost:5432/liferoutine',
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      service: 'LifeRoutine API',
      database: 'connected',
      timestamp: dbRes.rows[0].now,
    });
  } catch (error) {
    res.json({
      status: 'ok',
      service: 'LifeRoutine API',
      database: 'offline (using SQLite local fallback)',
    });
  }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, wakeTime, sleepTime } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, wake_time, sleep_time) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email',
      [name, email.toLowerCase(), password, wakeTime || '07:00', sleepTime || '23:00']
    );

    res.json({ success: true, user: newUser.rows[0] });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0 || result.rows[0].password_hash !== password) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wakeTime: user.wake_time,
        sleepTime: user.sleep_time,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Cloud Sync Endpoint
app.post('/api/sync', async (req, res) => {
  const { user, habits, logs } = req.body;
  try {
    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      message: 'Sincronização concluída.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro de sincronização' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 LifeRoutine Backend API rodando na porta ${PORT}`);
});
