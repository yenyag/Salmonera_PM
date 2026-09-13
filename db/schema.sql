-- Esquema y datos de prueba para Salmonera_PM (reemplaza Supabase localmente)
-- Ejecutar dentro de la base de datos salmonera_pm
-- ============================================================================
-- Datos calibrados para representar una empresa salmonera mediana chilena:
-- 4 centros de cultivo, ~3.400 t cosechadas/año, ventas ~CLP 22.000 millones/año.
-- Todos los paneles son coherentes entre sí:
--   ventas = exportaciones FOB + ventas de mercado local
--   rentabilidad por centro = distribución de las ventas totales
--   biomasa lote = unidades_sembradas x peso_promedio
--   mortalidad por lote = % realista acumulado del lote
-- ============================================================================

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
  cantidad INT NOT NULL        -- toneladas cosechadas en el periodo
);

CREATE TABLE IF NOT EXISTS lotes (
  id SERIAL PRIMARY KEY,
  lote_codigo TEXT NOT NULL,
  mortalidad_total NUMERIC(12,2) NOT NULL   -- mortalidad acumulada en unidades
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

-- Ventas mensuales (CLP). Coherentes con exportaciones (FOB) + mercado local.
-- Jan: 1.415.000.000 FOB + 95.000.000 local; Feb: 1.688,5M + 105M; etc.
INSERT INTO ventas (mes, total_mensual) VALUES
  ('2025-01-01', 1510000000),
  ('2025-02-01', 1794000000),
  ('2025-03-01', 2030000000),
  ('2025-04-01', 1800000000),
  ('2025-05-01', 2115000000),
  ('2025-06-01', 1985000000)
ON CONFLICT (mes) DO NOTHING;

-- Distribución de cosecha por calidad (toneladas, enero-junio 2025).
-- Total ~1.610 t, consistente con el volumen de los lotes cosechados.
INSERT INTO cosechas (calidad, cantidad) VALUES
  ('premium', 480),
  ('exportacion', 880),
  ('mercado_local', 200),
  ('descarte', 50)
ON CONFLICT (calidad) DO NOTHING;

-- Mortalidad acumulada por lote (unidades, 5-14% del stock sembrado)
INSERT INTO lotes (lote_codigo, mortalidad_total) VALUES
  ('LOTE-A1', 6200), ('LOTE-A2', 6600), ('LOTE-B1', 4800),
  ('LOTE-B2', 7500), ('LOTE-C1', 5100), ('LOTE-C2', 4900),
  ('LOTE-D1', 7800), ('LOTE-D2', 6300), ('LOTE-E1', 5300),
  ('LOTE-E2', 8100), ('LOTE-F1', 4200), ('LOTE-F2', 3300),
  ('LOTE-G1', 3400), ('LOTE-H1', 3900), ('LOTE-J1', 6600),
  ('LOTE-J2', 5700)
ON CONFLICT (lote_codigo) DO NOTHING;

-- Rentabilidad por centro (CLP). La suma = ventas totales del periodo
-- (Los Lagos 3.550M + Chiloé 3.250M + Quellón 2.400M + Aysén 2.034M = 11.234M CLP)
INSERT INTO centros (centro_nombre, total_ingresos_clp) VALUES
  ('Centro Quellón', 2400000000),
  ('Centro Chiloé', 3250000000),
  ('Centro Aysén', 2034000000),
  ('Centro Los Lagos', 3550000000)
ON CONFLICT (centro_nombre) DO NOTHING;

-- Permisos para el usuario de la aplicación
GRANT ALL ON ALL TABLES IN SCHEMA public TO salmonera;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO salmonera;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO salmonera;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO salmonera;