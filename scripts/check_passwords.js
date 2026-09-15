import bcrypt from 'bcryptjs';
import pg from 'pg';

try {
  process.loadEnvFile();
} catch {}

const { Pool } = pg;
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'salmonera',
  password: process.env.PGPASSWORD || 'salmonera123',
  database: process.env.PGDATABASE || 'salmonera_pm',
});

async function run() {
  const { rows } = await pool.query('SELECT id, email, password FROM usuarios');
  console.log('Usuarios en BD:', rows);
  
  // Set clean hashes for admin123 and juan123
  const hashAdmin = await bcrypt.hash('admin123', 10);
  const hashJuan = await bcrypt.hash('juan123', 10);
  
  await pool.query('UPDATE usuarios SET password = $1 WHERE email = $2', [hashAdmin, 'admin@salmonera.com']);
  await pool.query('UPDATE usuarios SET password = $1 WHERE email = $2', [hashJuan, 'juan@salmonera.com']);
  
  console.log('Contraseñas actualizadas con éxito a bcrypt(admin123) y bcrypt(juan123).');
  await pool.end();
}

run().catch(console.error);
