-- ============================================================================
-- MÓDULOS AMPLIADOS (EP1) - SalmoSUR S.A.
-- empleados (RRHH), inventario, compras/proveedores, exportaciones,
-- lotes detallados e incidentes/seguridad.
-- Datos simulados para demostración. Ejecutar EN la BD salmonera_pm.
-- Uso: PGPASSWORD=salmonera123 psql -h localhost -U salmonera -d salmonera_pm -f db/schema_modulos.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- TABLAS
-- ---------------------------------------------------------------------------

-- EMPLEADOS / RRHH
CREATE TABLE IF NOT EXISTS empleados (
  id SERIAL PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  rut TEXT UNIQUE NOT NULL,
  cargo TEXT NOT NULL,
  rango TEXT NOT NULL,
  salario_clp NUMERIC(12,2) NOT NULL,
  centro_nombre TEXT NOT NULL,
  fecha_ingreso DATE NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_empleados_rut ON empleados(rut);

-- INVENTARIO (alimento, medicamentos, herramientas, equipos)
CREATE TABLE IF NOT EXISTS inventario (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  nombre TEXT NOT NULL,
  unidad TEXT NOT NULL,
  stock NUMERIC(12,2) NOT NULL,
  stock_minimo NUMERIC(12,2) NOT NULL,
  costo_unitario_clp NUMERIC(12,2) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventario_nombre ON inventario(nombre);

-- PROVEEDORES y COMPRAS
CREATE TABLE IF NOT EXISTS proveedores (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  rubro TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS compras (
  id SERIAL PRIMARY KEY,
  proveedor_id INT NOT NULL REFERENCES proveedores(id),
  producto TEXT NOT NULL,
  cantidad NUMERIC(12,2) NOT NULL,
  unidad TEXT NOT NULL,
  valor_clp NUMERIC(14,2) NOT NULL,
  fecha DATE NOT NULL,
  centro_nombre TEXT NOT NULL
);

-- EXPORTACIONES
CREATE TABLE IF NOT EXISTS exportaciones (
  id SERIAL PRIMARY KEY,
  mes DATE NOT NULL,
  pais_destino TEXT NOT NULL,
  producto TEXT NOT NULL,
  kilos NUMERIC(12,2) NOT NULL,
  valor_fob_clp NUMERIC(14,2) NOT NULL,
  cert_sanitario TEXT NOT NULL
);

-- LOTES DETALLADOS (cultivo)
CREATE TABLE IF NOT EXISTS lotes_detalle (
  id SERIAL PRIMARY KEY,
  lote_codigo TEXT NOT NULL,
  especie TEXT NOT NULL,
  centro_nombre TEXT NOT NULL,
  fecha_siembra DATE NOT NULL,
  unidades_sembradas INT NOT NULL,
  biomasa_kg NUMERIC(14,2) NOT NULL,
  peso_promedio_kg NUMERIC(8,3) NOT NULL,
  fcr NUMERIC(6,3) NOT NULL,
  estado TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_lotes_detalle_codigo ON lotes_detalle(lote_codigo);

-- INCIDENTES / SEGURIDAD
CREATE TABLE IF NOT EXISTS incidentes (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL,
  severidad TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  accion_tomada TEXT NOT NULL,
  centro_nombre TEXT NOT NULL,
  estado TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- VISTAS PARA EL FRONTEND Y EL RAG
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_empleados AS
  SELECT nombre_completo, rut, cargo, rango, salario_clp, centro_nombre, fecha_ingreso
  FROM empleados ORDER BY salario_clp DESC;

CREATE OR REPLACE VIEW v_planilla_por_centro AS
  SELECT centro_nombre, COUNT(*) AS n_empleados, SUM(salario_clp) AS planilla_clp
  FROM empleados GROUP BY centro_nombre ORDER BY planilla_clp DESC;

CREATE OR REPLACE VIEW v_planilla_por_cargo AS
  SELECT cargo, rango, COUNT(*) AS n_empleados, SUM(salario_clp) AS planilla_clp
  FROM empleados GROUP BY cargo, rango ORDER BY planilla_clp DESC;

CREATE OR REPLACE VIEW v_inventario_resumen AS
  SELECT categoria, COUNT(*) AS n_items, SUM(stock * costo_unitario_clp) AS valor_total_clp
  FROM inventario GROUP BY categoria ORDER BY valor_total_clp DESC;

CREATE OR REPLACE VIEW v_stock_bajo AS
  SELECT categoria, nombre, stock, stock_minimo, costo_unitario_clp
  FROM inventario WHERE stock < stock_minimo ORDER BY (stock_minimo - stock) DESC;

CREATE OR REPLACE VIEW v_gasto_por_proveedor AS
  SELECT pr.nombre AS proveedor, pr.rubro, COUNT(c.id) AS n_compras, SUM(c.valor_clp) AS total_clp
  FROM compras c JOIN proveedores pr ON pr.id = c.proveedor_id
  GROUP BY pr.nombre, pr.rubro ORDER BY total_clp DESC;

CREATE OR REPLACE VIEW v_compras_recientes AS
  SELECT pr.nombre AS proveedor, c.producto, c.cantidad, c.unidad, c.valor_clp, c.fecha, c.centro_nombre
  FROM compras c JOIN proveedores pr ON pr.id = c.proveedor_id
  ORDER BY c.fecha DESC LIMIT 30;

CREATE OR REPLACE VIEW v_exportaciones_por_destino AS
  SELECT pais_destino, COUNT(*) AS n_envios, SUM(kilos) AS total_kilos, SUM(valor_fob_clp) AS total_fob_clp
  FROM exportaciones GROUP BY pais_destino ORDER BY total_fob_clp DESC;

CREATE OR REPLACE VIEW v_exportaciones_resumen AS
  SELECT mes, COUNT(*) AS n_envios, SUM(kilos) AS total_kilos, SUM(valor_fob_clp) AS total_fob_clp
  FROM exportaciones GROUP BY mes ORDER BY mes;

CREATE OR REPLACE VIEW v_lotes_detalle AS
  SELECT lote_codigo, especie, centro_nombre, fecha_siembra, unidades_sembradas,
         biomasa_kg, peso_promedio_kg, fcr, estado
  FROM lotes_detalle ORDER BY fcr;

CREATE OR REPLACE VIEW v_biomasa_por_centro AS
  SELECT centro_nombre, SUM(biomasa_kg) AS biomasa_kg
  FROM lotes_detalle GROUP BY centro_nombre ORDER BY biomasa_kg DESC;

CREATE OR REPLACE VIEW v_incidentes_por_tipo AS
  SELECT tipo, COUNT(*) AS n_incidentes
  FROM incidentes GROUP BY tipo ORDER BY n_incidentes DESC;

CREATE OR REPLACE VIEW v_incidentes_por_severidad AS
  SELECT severidad, COUNT(*) AS n_incidentes
  FROM incidentes GROUP BY severidad ORDER BY n_incidentes DESC;

-- ---------------------------------------------------------------------------
-- DATOS DE PRUEBA
-- ---------------------------------------------------------------------------

-- Empleados (25)
INSERT INTO empleados (nombre_completo, rut, cargo, rango, salario_clp, centro_nombre, fecha_ingreso) VALUES
  ('María Fernanda Soto Aravena',    '18.451.237-6', 'Gerente General',              'Gerencial',    4500000, 'Los Lagos', '2011-03-01'),
  ('Jorge Eduardo Muñoz Contreras',  '15.672.890-1', 'Gerente Comercial',            'Gerencial',    3600000, 'Los Lagos', '2013-07-15'),
  ('Rodrigo Antonio Cáceres Leiva',  '20.118.223-4', 'Operario de Cultivo',          'Operativo',     720000, 'Quellón',   '2019-01-10'),
  ('Carolina Paz Vega Silva',        '19.203.445-8', 'Jefa de Centro de Cultivo',    'Jefatura',     2400000, 'Chiloé',    '2015-05-20'),
  ('Sebastián Andrés Rojas Paredes', '17.834.556-2', 'Médico Veterinario',           'Profesional',  2600000, 'Aysén',     '2016-09-01'),
  ('Camila Andrea Fuentes Morales',  '18.902.341-5', 'Encargada de Alimentación',    'Profesional',  1500000, 'Los Lagos', '2018-02-12'),
  ('Pablo Esteban Carrasco Ríos',    '16.456.778-0', 'Buzo Comercial',               'Operativo',    1100000, 'Chiloé',    '2014-11-03'),
  ('Valentina Ignacia Torres García','19.567.109-3', 'Analista de Calidad',          'Profesional',  1400000, 'Los Lagos', '2020-06-08'),
  ('Matías Alejandro Salazar Orellana','15.221.884-7','Jefe de Planta de Proceso',   'Jefatura',     2800000, 'Quellón',   '2012-10-01'),
  ('Daniela Constanza Valdés Rojas', '20.345.667-9', 'Técnico Acuícola',             'Técnico',       950000, 'Aysén',     '2021-03-15'),
  ('Nicolás Enrique Gutiérrez Faúndez','17.928.114-4','Operario de Cultivo',         'Operativo',     700000, 'Los Lagos', '2017-08-21'),
  ('Francisca Belén Navarro Campos', '19.788.450-2', 'Asistente Administrativa',     'Técnico',       850000, 'Quellón',   '2022-01-05'),
  ('Cristian Mauricio Díaz Barra',   '14.887.320-6', 'Ingeniero en Acuicultura',     'Profesional',  2100000, 'Chiloé',    '2010-04-19'),
  ('Paula Andrea Herrera Núñez',     '18.665.902-4', 'Encargada de Salud Animal',    'Profesional',  1700000, 'Los Lagos', '2019-11-11'),
  ('Felipe Ignacio Martínez Cid',    '21.031.558-7', 'Operario de Cosecha',          'Operativo',     780000, 'Aysén',     '2023-02-27'),
  ('Javiera Antonia Riquelme Palma', '16.990.223-1', 'Jefa de Centro de Cultivo',    'Jefatura',     2300000, 'Quellón',   '2014-12-08'),
  ('Gonzalo Andrés Sepúlveda Durán', '15.445.601-8', 'Buzo Comercial',               'Operativo',    1200000, 'Los Lagos', '2013-06-24'),
  ('Constanza Belén Arriagada Gatica','19.334.687-5','Analista de Exportaciones',    'Profesional',  1450000, 'Quellón',   '2020-09-14'),
  ('Alejandro Javier Fuenzalida Bravo','17.210.990-3','Jefe de Bodega',              'Jefatura',     1650000, 'Chiloé',    '2016-04-04'),
  ('Daniela Francisca Lagos Pino',   '20.874.556-1', 'Operaria de Planta',           'Operativo',     650000, 'Quellón',   '2021-07-19'),
  ('Ricardo Hernán Espinoza Muñoz',  '14.302.778-4', 'Técnico en Mantención',        'Técnico',      1050000, 'Aysén',     '2011-08-30'),
  ('Lorena Patricia Cifuentes Rozas','17.556.204-9', 'Encargada de RRHH',            'Profesional',  1600000, 'Los Lagos', '2015-03-23'),
  ('Andrés Ismael Vergara Campos',   '20.667.341-8', 'Operario de Cultivo',          'Operativo',     710000, 'Chiloé',    '2020-10-05'),
  ('Catalina Andrea Maldonado Vera', '18.449.812-3', 'Ingeniera en Acuicultura',     'Profesional',  2000000, 'Aysén',     '2017-01-12'),
  ('Francisco Javier Morales Villarroel','16.780.445-0','Supervisor de Bioseguridad','Jefatura',     1850000, 'Los Lagos', '2012-02-06')
ON CONFLICT (rut) DO NOTHING;

-- Inventario (22)
INSERT INTO inventario (categoria, nombre, unidad, stock, stock_minimo, costo_unitario_clp) VALUES
  ('alimento',     'Alimento Extruido 3mm',          'unidades', 24000, 12000,   950),
  ('alimento',     'Alimento Extruido 6mm',          'unidades', 18000, 15000,   920),
  ('alimento',     'Alimento Extruido 9mm',          'unidades',  8500, 16000,   880),
  ('alimento',     'Alimento Premolido 2mm',         'unidades',  9000,  8000,   990),
  ('medicamentos', 'Vacuna Furu-IB',                 'unidades',  3500,  2000,  2100),
  ('medicamentos', 'Vacuna ISA',                     'unidades',   600,   800,  3400),
  ('medicamentos', 'Antibiótico Oxitetraciclina',    'unidades',   140,    60, 52000),
  ('medicamentos', 'Antibiótico Florfenicol',        'unidades',    85,    50, 61000),
  ('medicamentos', 'Anestésico MS-222',              'unidades',    90,    40, 45000),
  ('medicamentos', 'Vitamina C para pienso',         'unidades',   320,   150, 12500),
  ('herramientas', 'Red de cultivo 55mm',            'unidades',    28,    20, 1850000),
  ('herramientas', 'Red de cultivo 30mm',            'unidades',    15,    18, 2100000),
  ('herramientas', 'Boya HDPE 50L',                  'unidades',   220,   100,  38000),
  ('herramientas', 'Cuerda de amarre 20mm',          'unidades',    85,    50,  15000),
  ('herramientas', 'Kit de muestreo biológico',      'unidades',    12,    10,  96000),
  ('herramientas', 'Contenedor de mortalidad',       'unidades',     9,     6, 140000),
  ('equipos',      'Motor fuera de borda 60HP',      'unidades',     6,     4, 5200000),
  ('equipos',      'Compresor de aire industrial',   'unidades',     4,     3, 2800000),
  ('equipos',      'Hidrolavadora a presión',        'unidades',     5,     4, 1650000),
  ('equipos',      'Generador eléctrico 220V',       'unidades',     8,     5, 3200000),
  ('equipos',      'Equipo de oxigenación O2',       'unidades',    11,     6, 2400000),
  ('equipos',      'Sensor de oxígeno disuelto',     'unidades',    18,    10,  750000)
ON CONFLICT (nombre) DO NOTHING;

-- Proveedores (8)
INSERT INTO proveedores (id, nombre, rubro) VALUES
  (1, 'Salmon Feed S.A.',     'Alimento balanceado'),
  (2, 'VetAqua Chile',        'Medicamentos veterinarios'),
  (3, 'Redes del Sur',        'Redes y jaulas de cultivo'),
  (4, 'Marina Supply',        'Motores y equipos náuticos'),
  (5, 'Oxígeno Patagonia',    'Gases y oxigenación'),
  (6, 'BioLab Química',       'Reactivos e insumos de laboratorio'),
  (7, 'Transportes Austral',  'Logística y transporte'),
  (8, 'Nutreco Instrumental', 'Instrumental y EPP')
ON CONFLICT (id) DO NOTHING;

-- Compras (30)
INSERT INTO compras (proveedor_id, producto, cantidad, unidad, valor_clp, fecha, centro_nombre) VALUES
  (1, 'Alimento Extruido 6mm',   15000, 'kg',  13800000, '2025-01-10', 'Los Lagos'),
  (1, 'Alimento Extruido 9mm',   12000, 'kg',  10560000, '2025-01-18', 'Chiloé'),
  (1, 'Alimento Extruido 3mm',   10000, 'kg',   9500000, '2025-02-05', 'Quellón'),
  (1, 'Alimento Premolido 2mm',   6000, 'kg',   5940000, '2025-02-20', 'Aysén'),
  (1, 'Alimento Extruido 9mm',   14000, 'kg',  12320000, '2025-03-12', 'Los Lagos'),
  (2, 'Vacuna Furu-IB',           1200, 'unidades', 2520000, '2025-01-22', 'Chiloé'),
  (2, 'Vacuna ISA',                400, 'unidades', 1360000, '2025-02-08', 'Aysén'),
  (2, 'Antibiótico Florfenicol',    60, 'kg',  3660000, '2025-02-25', 'Los Lagos'),
  (2, 'Antibiótico Oxitetraciclina', 50, 'kg', 2600000, '2025-04-02', 'Quellón'),
  (2, 'Anestésico MS-222',          40, 'L',   1800000, '2025-05-14', 'Chiloé'),
  (3, 'Red de cultivo 55mm',         8, 'unidades', 14800000, '2025-01-15', 'Los Lagos'),
  (3, 'Red de cultivo 30mm',         6, 'unidades', 12600000, '2025-03-03', 'Quellón'),
  (3, 'Cuerda de amarre 20mm',      40, 'unidades',  600000, '2025-03-28', 'Chiloé'),
  (3, 'Boya HDPE 50L',             120, 'unidades', 4560000, '2025-04-15', 'Aysén'),
  (4, 'Motor fuera de borda 60HP',   2, 'unidades', 10400000, '2025-02-12', 'Chiloé'),
  (4, 'Compresor de aire industrial', 1, 'unidades', 2800000, '2025-05-06', 'Los Lagos'),
  (4, 'Hidrolavadora a presión',     1, 'unidades', 1650000, '2025-06-09', 'Aysén'),
  (5, 'Oxígeno líquido',            800, 'm3',  7200000, '2025-01-30', 'Los Lagos'),
  (5, 'Oxígeno líquido',            600, 'm3',  5400000, '2025-03-20', 'Chiloé'),
  (5, 'Oxígeno líquido',            700, 'm3',  6300000, '2025-05-28', 'Quellón'),
  (6, 'Reactivos de laboratorio',    30, 'unidades', 1350000, '2025-02-03', 'Los Lagos'),
  (6, 'Material de muestreo biológico', 20, 'unidades', 960000, '2025-04-22', 'Aysén'),
  (6, 'Kit de análisis de agua',     15, 'unidades', 2250000, '2025-06-01', 'Chiloé'),
  (7, 'Flete refrigerado Los Lagos-Puerto Montt', 12, 'servicios', 19200000, '2025-01-05', 'Los Lagos'),
  (7, 'Flete refrigerado Chiloé-Puerto Montt',    10, 'servicios', 15000000, '2025-02-18', 'Chiloé'),
  (7, 'Flete refrigerado Quellón-Puerto Montt',    9, 'servicios', 13500000, '2025-03-22', 'Quellón'),
  (7, 'Flete refrigerado Aysén-Puerto Montt',      8, 'servicios', 12800000, '2025-04-30', 'Aysén'),
  (8, 'Trajes de buzo (semi-seco)',  25, 'unidades', 3750000, '2025-02-14', 'Los Lagos'),
  (8, 'Lentes de seguridad y EPP',  200, 'unidades', 1600000, '2025-05-20', 'Quellón'),
  (8, 'Instrumental de muestreo',    40, 'unidades', 2400000, '2025-06-12', 'Chiloé')
ON CONFLICT (id) DO NOTHING;

-- Exportaciones (28)
INSERT INTO exportaciones (mes, pais_destino, producto, kilos, valor_fob_clp, cert_sanitario) VALUES
  ('2025-01-01', 'Estados Unidos', 'Salmón Atlántico HG',  85000, 720000000, 'CS-2025-001'),
  ('2025-01-01', 'Japón',          'Salmón Coho entero',   62000, 540000000, 'CS-2025-002'),
  ('2025-01-01', 'Brasil',         'Salmón Atlántico HG',  45000, 310000000, 'CS-2025-003'),
  ('2025-01-01', 'Unión Europea',  'Filete de Salmón',     38000, 420000000, 'CS-2025-004'),
  ('2025-02-01', 'Estados Unidos', 'Salmón Atlántico HG',  91000, 780000000, 'CS-2025-005'),
  ('2025-02-01', 'China',          'Salmón Coho entero',   48000, 350000000, 'CS-2025-006'),
  ('2025-02-01', 'Japón',          'Salmón Coho entero',   58000, 505000000, 'CS-2025-007'),
  ('2025-02-01', 'Unión Europea',  'Filete de Salmón',     42000, 465000000, 'CS-2025-008'),
  ('2025-02-01', 'Brasil',         'Salmón Atlántico HG',  40000, 275000000, 'CS-2025-009'),
  ('2025-03-01', 'Estados Unidos', 'Salmón Atlántico HG',  97000, 845000000, 'CS-2025-010'),
  ('2025-03-01', 'Japón',          'Salmón Coho entero',   66000, 590000000, 'CS-2025-011'),
  ('2025-03-01', 'Brasil',         'Salmón Atlántico HG',  50000, 355000000, 'CS-2025-012'),
  ('2025-03-01', 'China',          'Salmón Coho entero',   52000, 385000000, 'CS-2025-013'),
  ('2025-03-01', 'Unión Europea',  'Filete de Salmón',     46000, 510000000, 'CS-2025-014'),
  ('2025-04-01', 'Estados Unidos', 'Salmón Atlántico HG',  88000, 750000000, 'CS-2025-015'),
  ('2025-04-01', 'Japón',          'Salmón Coho entero',   60000, 520000000, 'CS-2025-016'),
  ('2025-04-01', 'Brasil',         'Salmón Atlántico HG',  47000, 325000000, 'CS-2025-017'),
  ('2025-04-01', 'Unión Europea',  'Filete de Salmón',     40000, 445000000, 'CS-2025-018'),
  ('2025-04-01', 'China',          'Salmón Coho entero',   49000, 360000000, 'CS-2025-019'),
  ('2025-05-01', 'Estados Unidos', 'Salmón Atlántico HG', 102000, 885000000, 'CS-2025-020'),
  ('2025-05-01', 'Japón',          'Salmón Coho entero',   64000, 555000000, 'CS-2025-021'),
  ('2025-05-01', 'Brasil',         'Salmón Atlántico HG',  53000, 375000000, 'CS-2025-022'),
  ('2025-05-01', 'Unión Europea',  'Filete de Salmón',     48000, 530000000, 'CS-2025-023'),
  ('2025-05-01', 'China',          'Salmón Coho entero',   51000, 375000000, 'CS-2025-024'),
  ('2025-06-01', 'Estados Unidos', 'Salmón Atlántico HG', 110000, 960000000, 'CS-2025-025'),
  ('2025-06-01', 'Japón',          'Salmón Coho entero',   68000, 590000000, 'CS-2025-026'),
  ('2025-06-01', 'Brasil',         'Salmón Atlántico HG',  56000, 395000000, 'CS-2025-027'),
  ('2025-06-01', 'Unión Europea',  'Filete de Salmón',     50000, 555000000, 'CS-2025-028')
ON CONFLICT (id) DO NOTHING;

-- Lotes detallados (20)
INSERT INTO lotes_detalle (lote_codigo, especie, centro_nombre, fecha_siembra, unidades_sembradas, biomasa_kg, peso_promedio_kg, fcr, estado) VALUES
  ('LOTE-A1', 'Salmón Atlántico', 'Los Lagos', '2024-03-15',  950000, 1250000, 3.450, 1.22, 'activo'),
  ('LOTE-A2', 'Salmón Atlántico', 'Chiloé',   '2024-04-20',  900000, 1180000, 3.280, 1.25, 'activo'),
  ('LOTE-B1', 'Salmón Coho',      'Quellón',  '2024-05-10',  700000,  860000, 2.950, 1.18, 'activo'),
  ('LOTE-B2', 'Salmón Atlántico', 'Aysén',    '2024-02-28',  880000, 1120000, 3.310, 1.31, 'activo'),
  ('LOTE-C1', 'Salmón Coho',      'Los Lagos', '2024-06-01',  650000,  790000, 2.750, 1.15, 'activo'),
  ('LOTE-D1', 'Salmón Atlántico', 'Los Lagos', '2023-11-12',  920000, 1520000, 4.850, 1.28, 'cosechado'),
  ('LOTE-D2', 'Salmón Atlántico', 'Chiloé',   '2023-12-05',  880000, 1380000, 4.620, 1.26, 'cosechado'),
  ('LOTE-E1', 'Salmón Coho',      'Quellón',  '2024-01-18',  720000,  980000, 3.890, 1.20, 'cosechado'),
  ('LOTE-E2', 'Salmón Atlántico', 'Aysén',    '2024-02-01',  900000, 1340000, 4.350, 1.29, 'cosechado'),
  ('LOTE-F1', 'Salmón Coho',      'Los Lagos', '2024-07-15',  680000,  720000, 2.860, 1.17, 'activo'),
  ('LOTE-F2', 'Salmón Atlántico', 'Chiloé',   '2024-08-20',  920000, 1010000, 3.120, 1.24, 'activo'),
  ('LOTE-G1', 'Salmón Atlántico', 'Quellón',  '2024-09-10',  890000,  940000, 2.940, 1.23, 'activo'),
  ('LOTE-G2', 'Salmón Coho',      'Aysén',    '2024-10-01',  700000,  660000, 2.630, 1.16, 'activo'),
  ('LOTE-H1', 'Salmón Atlántico', 'Los Lagos', '2024-11-15',  930000,  820000, 2.580, 1.21, 'activo'),
  ('LOTE-H2', 'Salmón Atlántico', 'Chiloé',   '2024-12-01',  910000,  760000, 2.420, 1.22, 'activo'),
  ('LOTE-I1', 'Salmón Coho',      'Quellón',  '2025-01-10',  710000,  540000, 2.310, 1.14, 'activo'),
  ('LOTE-I2', 'Salmón Atlántico', 'Aysén',    '2025-02-01',  940000,  610000, 2.010, 1.20, 'activo'),
  ('LOTE-J1', 'Salmón Atlántico', 'Los Lagos', '2023-08-01',  950000, 1650000, 5.120, 1.27, 'cosechado'),
  ('LOTE-J2', 'Salmón Coho',      'Chiloé',   '2023-09-15',  720000, 1110000, 4.210, 1.19, 'cosechado'),
  ('LOTE-K1', 'Salmón Atlántico', 'Quellón',  '2025-01-25',  900000,  430000, 1.890, 1.09, 'activo')
ON CONFLICT (lote_codigo) DO NOTHING;

-- Incidentes (18)
INSERT INTO incidentes (fecha, tipo, severidad, descripcion, accion_tomada, centro_nombre, estado) VALUES
  ('2025-01-08', 'bioseguridad', 'medio', 'Ingreso de embarcación sin desinfección al área de jaulas', 'Capacitación a tripulación y refuerzo del control de acceso.', 'Quellón', 'resuelto'),
  ('2025-01-19', 'escape',       'alto',  'Rotura de paño de red por ancla movida, escape parcial de peces', 'Retiro de red dañada, conteo de pérdida y reporte a Sernapesca.', 'Los Lagos', 'resuelto'),
  ('2025-02-03', 'sanitario',    'medio', 'Detección de focos aislados de caligus sobre umbral de control', 'Tratamiento con antiparasitario autorizado.', 'Chiloé', 'resuelto'),
  ('2025-02-17', 'ambiental',    'bajo',  'Nivel de oxígeno disuelto bajo durante 4 horas por floración algal', 'Activación de oxigenación de emergencia.', 'Aysén', 'resuelto'),
  ('2025-03-02', 'accidente',    'bajo',  'Resbalamiento de operario en cubierta, contusión leve', 'Atención en enfermería y entrega de EPP antideslizante.', 'Quellón', 'resuelto'),
  ('2025-03-15', 'escape',       'critico', 'Falla en traba de jaula generó apertura parcial y fuga de ~5.000 unidades', 'Inmovilización de jaula, reparación por buzo y censo.', 'Los Lagos', 'en_seguimiento'),
  ('2025-03-26', 'bioseguridad', 'medio', 'Mortalidad superior a lo normal en 48 horas sin causa clara', 'Activación de protocolo de contingencia y reporte a Sernapesca.', 'Aysén', 'resuelto'),
  ('2025-04-09', 'accidente',    'alto',  'Operario de planta con corte en mano al manipular fileteadora', 'Primeros auxilios y derivación a centro médico.', 'Quellón', 'resuelto'),
  ('2025-04-20', 'sanitario',    'alto',  'Brote de piscirickettsiosis (SRS) en lote con mortalidad 2.300', 'Tratamiento antibiótico y cuarentena del lote.', 'Aysén', 'en_seguimiento'),
  ('2025-05-02', 'escape',       'alto',  'Buceo de revisión detectó enmallado de red con riesgo de fuga', 'Refuerzo de red con paño de repuesto.', 'Chiloé', 'resuelto'),
  ('2025-05-11', 'bioseguridad', 'bajo',  'Visita externa sin registro de ingreso en bitácora', 'Regularización del registro y recordatorio de protocolo.', 'Los Lagos', 'resuelto'),
  ('2025-05-23', 'accidente',    'medio', 'Buzo con otitis por presión durante faena', 'Suspensión de faena y derivación al médico laboral.', 'Chiloé', 'resuelto'),
  ('2025-06-01', 'ambiental',    'medio', 'Floración algal en bahía colindante con riesgo de desoxigenación', 'Incremento del monitoreo y oxigenación preventiva.', 'Los Lagos', 'resuelto'),
  ('2025-06-14', 'sanitario',    'bajo',  'Detección de caligus en lote C1 bajo umbral', 'Monitoreo reforzado, sin tratamiento requerido.', 'Los Lagos', 'resuelto'),
  ('2025-06-28', 'escape',       'critico', 'Apertura de puerta de muestreo dejó salida de ~3.200 unidades', 'Censo al día siguiente y cambio de procedimiento de muestreo.', 'Quellón', 'abierto'),
  ('2025-07-05', 'accidente',    'alto',  'Operario con fractura de muñeca al caer desde escala de balsa', 'Traslado a urgencia, investigación de accidente y revisión de escala.', 'Chiloé', 'abierto'),
  ('2025-07-18', 'bioseguridad', 'medio', 'Detección de mortalidad anormal en borde de red del lote I2', 'Extracción de mortalidad, revisión de red y control veterinario.', 'Aysén', 'resuelto'),
  ('2025-08-01', 'ambiental',    'alto',  'Floración algal con mortalidad asociada en jaula 4 del Centro Quellón', 'Cosecha de emergencia parcial y oxigenación intensiva.', 'Quellón', 'en_seguimiento')
ON CONFLICT (id) DO NOTHING;