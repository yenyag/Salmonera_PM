import express from 'express';
import { Pool } from 'pg';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

try {
  process.loadEnvFile();
} catch {
  console.log('Sin archivo .env (se usarán valores por defecto)');
}

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

// --- Módulos ampliados (EP1) ------------------------------------------------

app.get('/api/empleados', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_empleados');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/empleados/planilla', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_planilla_por_cargo');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventario', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_inventario_resumen');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventario/bajo', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_stock_bajo');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/compras', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_gasto_por_proveedor');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/exportaciones', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_exportaciones_por_destino');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/exportaciones/mensual', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_exportaciones_resumen');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lotes', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_lotes_detalle');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lotes/biomasa', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_biomasa_por_centro');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/incidentes', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_incidentes_por_tipo');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/incidentes/severidad', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_incidentes_por_severidad');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Asistente RAG (FASE 4) ------------------------------------------------

const PYTHON = process.env.PYTHON_BIN || '/home/vrayirax/Documentos/actualizada⁄IngenierInteligencia-Artificial/.venv/bin/python';
const RAG_SCRIPT = join(__dirname, 'scripts', 'query_rag.py');
const RAG_MAX_CONCURRENT = 2;
let ragActive = 0;
const ragQueue = [];

function enqueueRag(callback) {
  if (ragActive < RAG_MAX_CONCURRENT) {
    ragActive++;
    callback();
  } else {
    ragQueue.push(callback);
  }
}

function releaseRag() {
  if (ragQueue.length > 0) {
    const next = ragQueue.shift();
    next();
  } else {
    ragActive--;
  }
}

app.post('/api/consultar', (req, res) => {
  const { pregunta } = req.body || {};

  if (!pregunta || !pregunta.trim()) {
    return res.status(400).json({ error: 'Falta el campo "pregunta"' });
  }

  const maxLen = 300;
  const texto = String(pregunta).trim().slice(0, maxLen);

  enqueueRag(() => {
    execFile(
      PYTHON,
      [RAG_SCRIPT, texto, '--json'],
      { timeout: 60000, maxBuffer: 1024 * 1024 },
      (err, stdout, stderr) => {
        releaseRag();
        if (err) {
          console.error('Error ejecutando RAG:', stderr || err.message);
          return res.status(500).json({ error: 'Error al consultar el asistente IA' });
        }

        try {
          const resultado = JSON.parse(stdout.trim());
          res.json({ respuesta: resultado.respuesta, fuentes: resultado.fuentes });
        } catch (e) {
          console.error('Respuesta RAG no parseable:', stdout);
          res.status(500).json({ error: 'Respuesta inválida del asistente IA' });
        }
      }
    );
  });
});

app.use(express.static(join(__dirname, 'public')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
