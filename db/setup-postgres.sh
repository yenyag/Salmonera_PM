#!/usr/bin/env bash
# Configura PostgreSQL localmente para Salmonera_PM (Fedora).
# Ejecutar con sudo: sudo bash db/setup-postgres.sh
set -e

PGDATA="/var/lib/pgsql/data"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Instalando PostgreSQL"
dnf install -y postgresql-server postgresql

echo "==> Inicializando cluster (si no existe)"
if [ ! -d "$PGDATA/base" ]; then
  postgresql-setup --initdb
fi

echo "==> Configurando autenticación por contraseña en localhost"
HBA="$PGDATA/pg_hba.conf"
if ! grep -q "salmonera-md5" "$HBA"; then
  cp "$HBA" "${HBA}.bak"
  # Forzar md5 para conexiones TCP desde localhost
  sed -i 's/^host\(.*\)127.0.0.1\/32\(.*\)ident/host\1 127.0.0.1\/32\2 md5 # salmonera-md5/' "$HBA"
  sed -i 's/^host\(.*\)::1\/128\(.*\)ident/host\1 ::1\/128\2 md5 # salmonera-md5/' "$HBA"
fi

echo "==> Arrancando PostgreSQL"
systemctl enable --now postgresql

echo "==> Creando rol y base de datos"
sudo -u postgres psql -v ON_ERROR_STOP=1 -f "$PROJECT_DIR/db/init.sql"

echo "==> Aplicando esquema y datos de prueba"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d salmonera_pm -f "$PROJECT_DIR/db/schema.sql"

echo "==> Listo. PostgreSQL configurado para Salmonera_PM."
