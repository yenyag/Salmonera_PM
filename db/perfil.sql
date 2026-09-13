-- ============================================================================
-- Migración PERFIL (SalmoSUR S.A.)
-- Agrega perfil de usuario (rol, cargo, centro, tema) y historial de
-- consultas al asistente. Idempotente: se puede ejecutar sobre una BD
-- existente (ya poblada) sin duplicar datos.
-- ============================================================================

-- 1. Nuevas columnas de perfil en usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'Administrador';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS centro_nombre TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_ingreso DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tema TEXT DEFAULT 'claro';

-- 2. Datos de perfil por defecto para el usuario administrador existente
UPDATE usuarios
   SET rol = 'Administrador',
       cargo = 'Gerente General',
       centro_nombre = 'Los Lagos',
       fecha_ingreso = '2011-03-01',
       tema = 'claro'
 WHERE email = 'admin@salmonera.com';

-- 3. Historial de consultas al asistente
CREATE TABLE IF NOT EXISTS chat_historial (
  id SERIAL PRIMARY KEY,
  usuario_email TEXT NOT NULL,
  pregunta TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  fuentes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_historial_email ON chat_historial(usuario_email);