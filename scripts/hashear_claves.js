#!/usr/bin/env node
/*
MIGRACIÓN SEGURIDAD - FASE 1
Convierte las contraseñas en texto plano de usuarios a hash bcrypt.
Idempotente: solo toca passwords que NO empiecen con '$2' (ya hasheados).

Uso:
    node scripts/hashear_claves.js
*/

import bcrypt from 'bcryptjs';
import pg from 'pg';

try {
  process.loadEnvFile();
} catch {
  console.log('Sin archivo .env (se usarán valores por defecto)');
}

const { Pool } = pg;
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'salmonera',
  password: process.env.PGPASSWORD || 'salmonera123',
  database: process.env.PGDATABASE || 'salmonera_pm',
});

const COSTO = 10; // 2^10 iteraciones de bcrypt (buena relación seguridad/velocidad)

async function main() {
  const { rows } = await pool.query('SELECT id, email, password FROM usuarios');

  let actualizados = 0;
  for (const u of rows) {
    if (u.password && u.password.startsWith('$2')) {
      console.log(`  = ${u.email}: ya está hasheado, se salta`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, COSTO);
    await pool.query('UPDATE usuarios SET password = $2 WHERE id = $1', [u.id, hash]);
    actualizados++;
    console.log(`  ✓ ${u.email}: texto plano -> hash bcrypt`);
  }

  console.log(`\n${actualizados} contraseña(s) hasheada(s).`);
  await pool.end();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});