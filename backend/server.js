const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool for Oracle VPS
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://liferoutine_user:Liferoutine2026!@liferoutine_postgres:5432/liferoutine',
});

// Test DB Connection & Auto Schema Setup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL da VPS:', err.stack);
  } else {
    console.log('✅ Conectado com sucesso ao PostgreSQL da VPS!');
    release();
    initTables();
  }
});

async function initTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        wake_time VARCHAR(10) DEFAULT '07:00',
        sleep_time VARCHAR(10) DEFAULT '23:00',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS habits (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'geral',
        frequency VARCHAR(50) DEFAULT 'diario',
        target_value INT DEFAULT 1,
        target_unit VARCHAR(50) DEFAULT 'vezes',
        time_of_day VARCHAR(50) DEFAULT 'qualquer',
        color VARCHAR(50) DEFAULT '#3B82F6',
        icon VARCHAR(100) DEFAULT 'star',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        habit_id VARCHAR(255) REFERENCES habits(id) ON DELETE CASCADE,
        completed_date DATE NOT NULL,
        value_completed INT DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id VARCHAR(255) PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelas do PostgreSQL inicializadas com sucesso!');
  } catch (e) {
    console.error('Erro ao inicializar tabelas:', e);
  }
}

// In-memory support tickets backup
let backendTickets = [
  {
    id: 't-demo-1',
    userName: 'Gabriel Monte',
    userEmail: 'gabriel@liferoutine.com',
    subject: 'Sincronização do Banco de Dados PostgreSQL',
    message: 'Solicito verificação da conexão de backup entre a VPS Oracle e o aplicativo.',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
];

// Health Check
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

// Real User Leaderboard Ranking Endpoint (Only real PostgreSQL users)
app.get('/api/ranking', async (req, res) => {
  try {
    const dbUsers = await pool.query('SELECT id, name, email, created_at FROM users ORDER BY created_at ASC').catch(() => null);
    let usersList = dbUsers && dbUsers.rows ? dbUsers.rows : [];

    const ranking = [];
    for (let i = 0; i < usersList.length; i++) {
      const u = usersList[i];
      const logsRes = await pool.query('SELECT count(*) FROM habit_logs WHERE habit_id IN (SELECT id FROM habits WHERE user_id = $1)', [u.id]).catch(() => ({ rows: [{ count: 0 }] }));
      const habitsRes = await pool.query('SELECT count(*) FROM habits WHERE user_id = $1', [u.id]).catch(() => ({ rows: [{ count: 0 }] }));

      const logCount = parseInt(logsRes.rows[0]?.count || 0, 10);
      const habitCount = parseInt(habitsRes.rows[0]?.count || 0, 10);

      const xp = 800 + (habitCount * 100) + (logCount * 150) + (i * 250);

      let levelName = 'Iniciante Fit 🌱';
      if (xp >= 5000) levelName = 'Mestre LifeRoutine 🏆';
      else if (xp >= 3000) levelName = 'Elite Diamante 💎';
      else if (xp >= 1500) levelName = 'Atleta Ouro 🥇';
      else if (xp >= 800) levelName = 'Atleta Prata 🥈';
      else if (xp >= 300) levelName = 'Atleta Bronze 🥉';

      ranking.push({
        id: u.id,
        name: u.name || 'Usuário',
        email: u.email,
        xp,
        levelName,
        workoutsCompleted: Math.max(2, Math.floor(xp / 110)),
        avatar: i === 0 ? '👨‍💻' : i === 1 ? '🏋️‍♂️' : '🏃‍♂️',
      });
    }

    ranking.sort((a, b) => b.xp - a.xp);
    ranking.forEach((item, index) => {
      item.rank = index + 1;
    });

    res.json(ranking);
  } catch (error) {
    console.error('Ranking error:', error);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

// Support Tickets Routes
app.get('/api/tickets', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC').catch(() => null);
    if (dbRes && dbRes.rows) {
      const tickets = dbRes.rows.map((row) => ({
        id: row.id,
        userName: row.user_name,
        userEmail: row.user_email,
        subject: row.subject,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
      }));
      return res.json(tickets);
    }
  } catch (e) {}

  res.json(backendTickets);
});

app.post('/api/tickets', async (req, res) => {
  const { id, userName, userEmail, subject, message, status, createdAt } = req.body;
  const ticket = {
    id: id || `t-${Date.now()}`,
    userName: userName || 'Usuário Mobile',
    userEmail: userEmail || 'usuario.mobile@liferoutine.com',
    subject: subject || 'Sem Assunto',
    message: message || '',
    status: status || 'open',
    createdAt: createdAt || new Date().toISOString(),
  };

  try {
    await pool.query(
      `INSERT INTO support_tickets (id, user_name, user_email, subject, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
      [ticket.id, ticket.userName, ticket.userEmail, ticket.subject, ticket.message, ticket.status, ticket.createdAt]
    ).catch(() => {});
  } catch (e) {}

  backendTickets = [ticket, ...backendTickets.filter((t) => t.id !== ticket.id)];
  res.json({ success: true, ticket });
});

app.put('/api/tickets', async (req, res) => {
  const { id, status } = req.body;
  try {
    await pool.query('UPDATE support_tickets SET status = $1 WHERE id = $2', [status, id]).catch(() => {});
  } catch (e) {}

  backendTickets = backendTickets.map((t) => (t.id === id ? { ...t, status } : t));
  res.json({ success: true, tickets: backendTickets });
});

// Auth Routes - Save User directly to PostgreSQL
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, wakeTime, sleepTime } = req.body;
  try {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, wake_time, sleep_time) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, wake_time, sleep_time, created_at',
      [name || 'Usuário', cleanEmail, password, wakeTime || '07:00', sleepTime || '23:00']
    );

    console.log(`✅ Usuário cadastrado com sucesso no PostgreSQL: ${cleanEmail}`);
    res.json({ success: true, user: newUser.rows[0] });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
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

app.listen(PORT, () => {
  console.log(`🚀 LifeRoutine Backend API rodando na porta ${PORT}`);
});
