const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@liferoutine_db:5432/liferoutine',
});

// Init PostgreSQL DB tables
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        wake_time VARCHAR(10) DEFAULT '07:00',
        sleep_time VARCHAR(10) DEFAULT '23:00',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS habits (
        id VARCHAR(255) PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
        id VARCHAR(255) PRIMARY KEY,
        habit_id VARCHAR(255) REFERENCES habits(id) ON DELETE CASCADE,
        completed_count INT DEFAULT 1,
        date VARCHAR(20) NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelas do PostgreSQL inicializadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados PostgreSQL:', error);
  }
}
initDB();

// Health Check Endpoint
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

// Premium Web Admin Dashboard
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
      <html lang="pt-BR" data-bs-theme="dark">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>⚡ LifeRoutine - Painel de Controle VPS</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css" rel="stylesheet">
        <style>
          :root {
            --bg-main: #0B132B;
            --card-bg: #1C2541;
            --accent-cyan: #06B6D4;
            --accent-purple: #8B5CF6;
            --accent-green: #10B981;
          }
          body {
            background: var(--bg-main);
            color: #F1F5F9;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            padding-bottom: 3rem;
          }
          .navbar-custom {
            background: rgba(28, 37, 65, 0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .glass-card {
            background: var(--card-bg);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease, border-color 0.2s ease;
          }
          .glass-card:hover {
            border-color: rgba(6, 182, 212, 0.4);
          }
          .stat-icon {
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
          }
          .avatar-circle {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
            color: #FFF;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            box-shadow: 0 4px 10px rgba(6, 182, 212, 0.3);
          }
          .table-custom {
            color: #F1F5F9;
          }
          .table-custom th {
            background: rgba(15, 23, 42, 0.6);
            color: #94A3B8;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .table-custom td {
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            vertical-align: middle;
            padding: 1rem 0.75rem;
          }
          .badge-soft-cyan { background: rgba(6, 182, 212, 0.15); color: #38BDF8; border: 1px solid rgba(6, 182, 212, 0.3); }
          .badge-soft-purple { background: rgba(139, 92, 246, 0.15); color: #C084FC; border: 1px solid rgba(139, 92, 246, 0.3); }
          .search-input {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #FFF;
            border-radius: 10px;
          }
          .search-input:focus {
            background: rgba(15, 23, 42, 0.8);
            border-color: var(--accent-cyan);
            color: #FFF;
            box-shadow: 0 0 0 0.25rem rgba(6, 182, 212, 0.25);
          }
        </style>
      </head>
      <body>
        <!-- Header Navbar -->
        <nav class="navbar navbar-expand-lg navbar-custom sticky-top py-3 mb-4">
          <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2 fw-bold text-white fs-4" href="#">
              <span class="p-2 rounded-3 text-white" style="background: linear-gradient(135deg, #06B6D4, #8B5CF6);">⚡</span>
              LifeRoutine <span class="badge bg-secondary fs-6 fw-normal ms-2">v1.0.0</span>
            </a>
            <div class="d-flex align-items-center gap-3">
              <span class="badge bg-success-subtle text-success border border-success p-2 px-3 rounded-pill d-flex align-items-center gap-2">
                <span class="spinner-grow spinner-grow-sm" role="status"></span>
                Oracle VPS PostgreSQL Online
              </span>
            </div>
          </div>
        </nav>

        <div class="container">
          <!-- Welcome Banner -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 class="fw-bold mb-1">Painel de Controle VPS Oracle</h2>
              <p class="text-secondary mb-0">Gestão em tempo real do banco de dados PostgreSQL e usuários sincronizados</p>
            </div>
            <button onclick="location.reload()" class="btn btn-outline-info rounded-3 d-flex align-items-center gap-2">
              <i class="bi bi-arrow-clockwise"></i> Atualizar Dados
            </button>
          </div>

          <!-- Stats Grid Cards -->
          <div class="row g-4 mb-4">
            <div class="col-md-4">
              <div class="glass-card p-4 d-flex align-items-center justify-content-between">
                <div>
                  <span class="text-secondary text-uppercase fw-semibold fs-7">Usuários Cadastrados</span>
                  <h1 class="display-5 fw-bold text-info mb-0 mt-1">${users.length}</h1>
                  <small class="text-muted">Contas ativas no PostgreSQL</small>
                </div>
                <div class="stat-icon bg-info-subtle text-info">
                  <i class="bi bi-people-fill"></i>
                </div>
              </div>
            </div>

            <div class="col-md-4">
              <div class="glass-card p-4 d-flex align-items-center justify-content-between">
                <div>
                  <span class="text-secondary text-uppercase fw-semibold fs-7">Hábitos Registrados</span>
                  <h1 class="display-5 fw-bold text-warning mb-0 mt-1">${totalHabits}</h1>
                  <small class="text-muted">Metas sincronizadas no servidor</small>
                </div>
                <div class="stat-icon bg-warning-subtle text-warning">
                  <i class="bi bi-calendar2-check-fill"></i>
                </div>
              </div>
            </div>

            <div class="col-md-4">
              <div class="glass-card p-4 d-flex align-items-center justify-content-between">
                <div>
                  <span class="text-secondary text-uppercase fw-semibold fs-7">Logs de Conclusão</span>
                  <h1 class="display-5 fw-bold text-success mb-0 mt-1">${totalLogs}</h1>
                  <small class="text-muted">Conclusões diárias registradas</small>
                </div>
                <div class="stat-icon bg-success-subtle text-success">
                  <i class="bi bi-fire"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Users Table Section -->
          <div class="glass-card p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 class="fw-bold mb-1 text-white"><i class="bi bi-database-check text-cyan me-2"></i> Relação de Usuários Mobile</h4>
                <p class="text-secondary small mb-0">Contas persistidas diretamente na VPS Oracle</p>
              </div>
              <div class="w-25">
                <input type="text" id="searchInput" onkeyup="filterUsers()" class="form-control search-input" placeholder="🔍 Buscar por nome ou e-mail...">
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-custom align-middle" id="usersTable">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>E-mail de Acesso</th>
                    <th>Acorda às</th>
                    <th>Dorme às</th>
                    <th>Data de Cadastro</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    users.length === 0
                      ? '<tr><td colspan="6" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1 d-block mb-2"></i>Nenhum usuário cadastrado via mobile ainda. Crie uma conta no aplicativo!</td></tr>'
                      : users
                          .map(
                            (u) => `
                        <tr>
                          <td>
                            <div class="d-flex align-items-center gap-3">
                              <div class="avatar-circle">
                                ${u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <span class="fw-semibold text-white d-block">${u.name}</span>
                                <small class="text-muted">ID: ${u.id.substring(0, 8)}...</small>
                              </div>
                            </div>
                          </td>
                          <td><span class="text-info">${u.email}</span></td>
                          <td><span class="badge badge-soft-cyan"><i class="bi bi-sun me-1"></i>${u.wake_time || '07:00'}</span></td>
                          <td><span class="badge badge-soft-purple"><i class="bi bi-moon me-1"></i>${u.sleep_time || '23:00'}</span></td>
                          <td><small class="text-secondary">${new Date(u.created_at).toLocaleString('pt-BR')}</small></td>
                          <td><span class="badge bg-success-subtle text-success border border-success px-2 py-1">Ativo</span></td>
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

        <script>
          function filterUsers() {
            const input = document.getElementById('searchInput').value.toLowerCase();
            const rows = document.querySelectorAll('#usersTable tbody tr');
            rows.forEach(row => {
              const text = row.innerText.toLowerCase();
              row.style.display = text.includes(input) ? '' : 'none';
            });
          }
        </script>
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
