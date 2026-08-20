import express from 'express';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'salmonera',
  password: process.env.PGPASSWORD || 'salmonera123',
  database: process.env.PGDATABASE || 'salmonera_pm',
});

const app = express();
app.use(express.json());

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT nombre, email FROM usuarios WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ventas', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT mes, total_mensual FROM v_ventas_por_mes');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/calidad', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT calidad, cantidad_cosechas FROM vista_distribucion_por_calidad');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mortalidad', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT lote_codigo, mortalidad_total FROM vista_mortalidad_acumulada');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rentabilidad', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT centro_nombre, total_ingresos_clp FROM vista_rentabilidad_por_centro');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(join(__dirname, 'public')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
