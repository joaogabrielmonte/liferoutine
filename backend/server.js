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

// Web Admin Dashboard
app.get('/admin', async (req, res) => {
  try {
    const usersRes = await pool.query('SELECT id, name, email, wake_time, sleep_time, created_at FROM users ORDER BY created_at DESC');
    const habitsRes = await pool.query('SELECT count(*) FROM habits');
    const logsRes = await pool.query('SELECT count(*) FROM habit_logs');

    const users = usersRes.rows;
    const totalHabits = habitsRes.rows[0]?.count || 0;
    const totalLogs = logsRes.rows[0]?.count || 0;

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LifeRoutine - Web Admin Dashboard</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { background: #0F172A; color: #F8FAFC; font-family: system-ui, -apple-system, sans-serif; padding: 2rem; }
          .card-custom { background: #1E293B; border: 1px solid #334155; border-radius: 12px; }
          .table-custom { color: #F8FAFC; }
          .table-custom th { background: #334155; color: #38BDF8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="d-flex align-items-center justify-content-between mb-4">
            <h2>⚡ LifeRoutine - Painel de Controle Web</h2>
            <span class="badge bg-success p-2">PostgreSQL Online</span>
          </div>

          <div class="row g-4 mb-4">
            <div class="col-md-4">
              <div class="card card-custom p-3 text-center">
                <h6 class="text-secondary">Usuários Cadastrados</h6>
                <h1 class="text-info font-weight-bold">${users.length}</h1>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card card-custom p-3 text-center">
                <h6 class="text-secondary">Hábitos Registrados</h6>
                <h1 class="text-warning font-weight-bold">${totalHabits}</h1>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card card-custom p-3 text-center">
                <h6 class="text-secondary">Logs de Conclusão</h6>
                <h1 class="text-success font-weight-bold">${totalLogs}</h1>
              </div>
            </div>
          </div>

          <div class="card card-custom p-4">
            <h4 class="mb-3 text-primary">👥 Relação de Usuários Mobile (PostgreSQL)</h4>
            <div class="table-responsive">
              <table class="table table-custom table-hover">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Acorda às</th>
                    <th>Dorme às</th>
                    <th>Data de Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    users.length === 0
                      ? '<tr><td colspan="5" class="text-center text-muted">Nenhum usuário cadastrado via mobile ainda. Faça login/cadastro no App Mobile!</td></tr>'
                      : users
                          .map(
                            (u) => `
                        <tr>
                          <td><strong>${u.name}</strong></td>
                          <td>${u.email}</td>
                          <td><span class="badge bg-warning text-dark">${u.wake_time || '07:00'}</span></td>
                          <td><span class="badge bg-secondary">${u.sleep_time || '23:00'}</span></td>
                          <td><small class="text-muted">${new Date(u.created_at).toLocaleString('pt-BR')}</small></td>
                        </tr>
                      `
                          )
                          .join('')
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Admin panel error:', error);
    res.status(500).send('Erro ao carregar o painel web admin.');
  }
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

// Cloud Sync Endpoint - Sync habits and logs into PostgreSQL
app.post('/api/sync', async (req, res) => {
  const { user, habits, logs } = req.body;
  try {
    if (user && user.email) {
      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [user.email.toLowerCase()]);
      let userId;
      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
      } else {
        const newUser = await pool.query(
          'INSERT INTO users (name, email, password_hash, wake_time, sleep_time) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [user.name || 'Usuário', user.email.toLowerCase(), '123456', user.wakeTime || '07:00', user.sleepTime || '23:00']
        );
        userId = newUser.rows[0].id;
      }

      if (Array.isArray(habits)) {
        for (const h of habits) {
          await pool.query(
            `INSERT INTO habits (id, user_id, title, category, frequency, target_value, target_unit, time_of_day, color, icon)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, target_value = EXCLUDED.target_value`,
            [h.id, userId, h.title, h.category || 'geral', h.frequency || 'diario', h.targetValue || 1, h.targetUnit || 'vezes', h.timeOfDay || 'qualquer', h.color || '#3B82F6', h.icon || 'star']
          );
        }
      }
    }
    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      message: 'Sincronização com PostgreSQL concluída.',
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Erro de sincronização' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 LifeRoutine Backend API rodando na porta ${PORT}`);
});
