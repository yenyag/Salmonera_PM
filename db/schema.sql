-- Esquema y datos de prueba para Salmonera_PM (reemplaza Supabase localmente)
-- Ejecutar dentro de la base de datos salmonera_pm

-- Usuarios (login)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Datos base para los gráficos
CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  mes DATE NOT NULL,
  total_mensual NUMERIC(14,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS cosechas (
  id SERIAL PRIMARY KEY,
  calidad TEXT NOT NULL,
  cantidad INT NOT NULL
);

CREATE TABLE IF NOT EXISTS lotes (
  id SERIAL PRIMARY KEY,
  lote_codigo TEXT NOT NULL,
  mortalidad_total NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS centros (
  id SERIAL PRIMARY KEY,
  centro_nombre TEXT NOT NULL,
  total_ingresos_clp NUMERIC(14,2) NOT NULL
);

-- Índices únicos para que el seed sea idempotente (re-ejecutable)
CREATE UNIQUE INDEX IF NOT EXISTS uq_ventas_mes ON ventas(mes);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cosechas_calidad ON cosechas(calidad);
CREATE UNIQUE INDEX IF NOT EXISTS uq_lotes_codigo ON lotes(lote_codigo);
CREATE UNIQUE INDEX IF NOT EXISTS uq_centros_nombre ON centros(centro_nombre);

-- Vistas usadas por el frontend (mismos nombres que en Supabase)
CREATE OR REPLACE VIEW v_ventas_por_mes AS
  SELECT mes, total_mensual FROM ventas ORDER BY mes;

CREATE OR REPLACE VIEW vista_distribucion_por_calidad AS
  SELECT calidad, SUM(cantidad) AS cantidad_cosechas
  FROM cosechas GROUP BY calidad;

CREATE OR REPLACE VIEW vista_mortalidad_acumulada AS
  SELECT lote_codigo, mortalidad_total FROM lotes;

CREATE OR REPLACE VIEW vista_rentabilidad_por_centro AS
  SELECT centro_nombre, total_ingresos_clp FROM centros;

-- Función equivalente a la RPC verificar_login de Supabase
CREATE OR REPLACE FUNCTION verificar_login(_email TEXT, _pass TEXT)
RETURNS TABLE(nombre TEXT, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.nombre, u.email
  FROM usuarios u
  WHERE u.email = _email AND u.password = _pass;
END;
$$ LANGUAGE plpgsql;

-- Datos de prueba: usuario admin (credenciales restablecidas)
INSERT INTO usuarios (nombre, email, password) VALUES
  ('Administrador', 'admin@salmonera.com', 'admin123'),
  ('Juan Pérez', 'juan@salmonera.com', 'juan123')
ON CONFLICT (email) DO NOTHING;

-- Ventas mensuales (CLP)
INSERT INTO ventas (mes, total_mensual) VALUES
  ('2025-01-01', 125000000),
  ('2025-02-01', 138000000),
  ('2025-03-01', 152000000),
  ('2025-04-01', 141000000),
  ('2025-05-01', 167000000),
  ('2025-06-01', 182000000)
ON CONFLICT (mes) DO NOTHING;

-- Distribución por calidad
INSERT INTO cosechas (calidad, cantidad) VALUES
  ('premium', 320),
  ('exportacion', 540),
  ('mercado_local', 210),
  ('descarte', 95)
ON CONFLICT (calidad) DO NOTHING;

-- Mortalidad acumulada por lote
INSERT INTO lotes (lote_codigo, mortalidad_total) VALUES
  ('LOTE-A1', 1200),
  ('LOTE-A2', 1850),
  ('LOTE-B1', 980),
  ('LOTE-B2', 2300),
  ('LOTE-C1', 1450)
ON CONFLICT (lote_codigo) DO NOTHING;

-- Rentabilidad por centro
INSERT INTO centros (centro_nombre, total_ingresos_clp) VALUES
  ('Centro Quellón', 420000000),
  ('Centro Chiloé', 380000000),
  ('Centro Aysén', 295000000),
  ('Centro Los Lagos', 510000000)
ON CONFLICT (centro_nombre) DO NOTHING;

-- Permisos para el usuario de la aplicación
GRANT ALL ON ALL TABLES IN SCHEMA public TO salmonera;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO salmonera;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO salmonera;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO salmonera;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO salmonera;
