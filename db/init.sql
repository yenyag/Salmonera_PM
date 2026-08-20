-- Ejecutar como superusuario (postgres) para crear rol y base de datos
-- sudo -u postgres psql -v ON_ERROR_STOP=1 -f db/init.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'salmonera') THEN
    CREATE ROLE salmonera LOGIN PASSWORD 'salmonera123';
  END IF;
END
$$;

-- Forzar la contraseña en cada ejecución (idempotente y evita desajustes)
ALTER ROLE salmonera WITH PASSWORD 'salmonera123';

SELECT 'CREATE DATABASE salmonera_pm OWNER salmonera'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'salmonera_pm')\gexec

GRANT ALL PRIVILEGES ON DATABASE salmonera_pm TO salmonera;
