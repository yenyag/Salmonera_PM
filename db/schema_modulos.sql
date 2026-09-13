-- ============================================================================
-- MÓDULOS AMPLIADOS (EP1) - SalmoSUR S.A.
-- empleados (RRHH), inventario, compras/proveedores, exportaciones,
-- lotes detallados e incidentes/seguridad.
-- + NUEVAS DIMENSIONES OPERATIVAS: concesiones, monitoreo sanitario/ambiental,
--   alimentación y clientes (conocimiento adicional para el asistente RAG).
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

-- EXPORTACIONES (valor FOB calibrado a precios reales de mercado 2025:
-- Atlántico HG ~5.800-6.200 CLP/kg, Coho entero ~4.700-5.200 CLP/kg,
-- Filete premium ~9.700-10.200 CLP/kg)
CREATE TABLE IF NOT EXISTS exportaciones (
  id SERIAL PRIMARY KEY,
  mes DATE NOT NULL,
  pais_destino TEXT NOT NULL,
  producto TEXT NOT NULL,
  kilos NUMERIC(12,2) NOT NULL,
  valor_fob_clp NUMERIC(14,2) NOT NULL,
  cert_sanitario TEXT NOT NULL
);

-- LOTES DETALLADOS (cultivo). Tamaño realista para empresa mediana:
-- 40-80k smolts por lote, biomasa = unidades x peso promedio.
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
-- NUEVAS DIMENSIONES PARA EL ASISTENTE IA
-- ---------------------------------------------------------------------------

-- CONCESIONES ACUÍCOLAS: ubicación geográfica, especies y capacidad autorizadas
-- (las concesiones son el "terreno" de cultivo regulado por SERNAPESCA)
CREATE TABLE IF NOT EXISTS concesiones (
  id SERIAL PRIMARY KEY,
  centro_nombre TEXT UNIQUE NOT NULL,
  sector TEXT NOT NULL,
  region TEXT NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  superficie_ha NUMERIC(6,2) NOT NULL,
  n_jaulas INT NOT NULL,
  especies_autorizadas TEXT NOT NULL,
  vigencia TEXT NOT NULL
);

-- MONITOREO SANITARIO / AMBIENTAL: caligus, temperatura, oxígeno y mortalidad
-- mensual por lote (base del alertamiento sanitario del sector)
CREATE TABLE IF NOT EXISTS monitoreo_sanitario (
  id SERIAL PRIMARY KEY,
  lote_codigo TEXT NOT NULL REFERENCES lotes_detalle(lote_codigo),
  mes DATE NOT NULL,
  caligus_hembras_ovigeras_prom NUMERIC(5,2) NOT NULL,
  temperatura_c NUMERIC(4,1) NOT NULL,
  oxigeno_mg_l NUMERIC(4,1) NOT NULL,
  mortalidad_mes INT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_monitoreo_lote_mes ON monitoreo_sanitario(lote_codigo, mes);

-- ALIMENTACIÓN: raciones entregadas (kg y costo) por lote y mes. Permite
-- contrastar el FCR de cada lote con el alimento realmente entregado.
CREATE TABLE IF NOT EXISTS alimentacion (
  id SERIAL PRIMARY KEY,
  lote_codigo TEXT NOT NULL REFERENCES lotes_detalle(lote_codigo),
  mes DATE NOT NULL,
  tipo_alimento TEXT NOT NULL,
  kg_entregados NUMERIC(12,2) NOT NULL,
  costo_clp NUMERIC(14,2) NOT NULL
);

-- CLIENTES: compradores vigentes, producto principal y condiciones comerciales
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  pais TEXT NOT NULL,
  contacto TEXT NOT NULL,
  producto_principal TEXT NOT NULL,
  condiciones_pago TEXT NOT NULL,
  contrato_tipo TEXT NOT NULL
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

-- Vistas de las nuevas dimensiones
CREATE OR REPLACE VIEW v_concesiones AS
  SELECT centro_nombre, sector, region, latitude, longitude, superficie_ha, n_jaulas,
         especies_autorizadas, vigencia
  FROM concesiones ORDER BY centro_nombre;

CREATE OR REPLACE VIEW v_monitoreo_promedio AS
  SELECT lote_codigo,
         ROUND(AVG(caligus_hembras_ovigeras_prom), 2) AS caligus_promedio,
         ROUND(AVG(temperatura_c), 1) AS temperatura_promedio_c,
         ROUND(MIN(oxigeno_mg_l), 1) AS oxigeno_minimo_mg_l,
         SUM(mortalidad_mes) AS mortalidad_total_periodo
  FROM monitoreo_sanitario GROUP BY lote_codigo ORDER BY caligus_promedio DESC;

CREATE OR REPLACE VIEW v_alimentacion_resumen AS
  SELECT lote_codigo, SUM(kg_entregados) AS total_kg, SUM(costo_clp) AS total_costo_clp
  FROM alimentacion GROUP BY lote_codigo ORDER BY total_costo_clp DESC;

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
  ('alimento',     'Alimento Extruido 3mm',          'kg', 24000, 12000,   950),
  ('alimento',     'Alimento Extruido 6mm',          'kg', 18000, 15000,   920),
  ('alimento',     'Alimento Extruido 9mm',          'kg',  8500, 16000,   880),
  ('alimento',     'Alimento Premolido 2mm',         'kg',  9000,  8000,   990),
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

-- Exportaciones (28) - precios FOB de mercado (CLP/kg)
INSERT INTO exportaciones (mes, pais_destino, producto, kilos, valor_fob_clp, cert_sanitario) VALUES
  ('2025-01-01', 'Estados Unidos', 'Salmón Atlántico HG',  85000,  493000000, 'CS-2025-001'),
  ('2025-01-01', 'Japón',          'Salmón Coho entero',   62000,  297600000, 'CS-2025-002'),
  ('2025-01-01', 'Brasil',         'Salmón Atlántico HG',  45000,  252000000, 'CS-2025-003'),
  ('2025-01-01', 'Unión Europea',  'Filete de Salmón',     38000,  372400000, 'CS-2025-004'),
  ('2025-02-01', 'Estados Unidos', 'Salmón Atlántico HG',  91000,  536900000, 'CS-2025-005'),
  ('2025-02-01', 'China',          'Salmón Coho entero',   48000,  225600000, 'CS-2025-006'),
  ('2025-02-01', 'Japón',          'Salmón Coho entero',   58000,  284200000, 'CS-2025-007'),
  ('2025-02-01', 'Unión Europea',  'Filete de Salmón',     42000,  415800000, 'CS-2025-008'),
  ('2025-02-01', 'Brasil',         'Salmón Atlántico HG',  40000,  226000000, 'CS-2025-009'),
  ('2025-03-01', 'Estados Unidos', 'Salmón Atlántico HG',  97000,  582000000, 'CS-2025-010'),
  ('2025-03-01', 'Japón',          'Salmón Coho entero',   66000,  330000000, 'CS-2025-011'),
  ('2025-03-01', 'Brasil',         'Salmón Atlántico HG',  50000,  285000000, 'CS-2025-012'),
  ('2025-03-01', 'China',          'Salmón Coho entero',   52000,  249600000, 'CS-2025-013'),
  ('2025-03-01', 'Unión Europea',  'Filete de Salmón',     46000,  460000000, 'CS-2025-014'),
  ('2025-04-01', 'Estados Unidos', 'Salmón Atlántico HG',  88000,  519200000, 'CS-2025-015'),
  ('2025-04-01', 'Japón',          'Salmón Coho entero',   60000,  294000000, 'CS-2025-016'),
  ('2025-04-01', 'Brasil',         'Salmón Atlántico HG',  47000,  263200000, 'CS-2025-017'),
  ('2025-04-01', 'Unión Europea',  'Filete de Salmón',     40000,  388000000, 'CS-2025-018'),
  ('2025-04-01', 'China',          'Salmón Coho entero',   49000,  230300000, 'CS-2025-019'),
  ('2025-05-01', 'Estados Unidos', 'Salmón Atlántico HG', 102000,  622200000, 'CS-2025-020'),
  ('2025-05-01', 'Japón',          'Salmón Coho entero',   64000,  326400000, 'CS-2025-021'),
  ('2025-05-01', 'Brasil',         'Salmón Atlántico HG',  53000,  304800000, 'CS-2025-022'),
  ('2025-05-01', 'Unión Europea',  'Filete de Salmón',     48000,  470400000, 'CS-2025-023'),
  ('2025-05-01', 'China',          'Salmón Coho entero',   51000,  249900000, 'CS-2025-024'),
  ('2025-06-01', 'Estados Unidos', 'Salmón Atlántico HG', 110000,  682000000, 'CS-2025-025'),
  ('2025-06-01', 'Japón',          'Salmón Coho entero',   68000,  353600000, 'CS-2025-026'),
  ('2025-06-01', 'Brasil',         'Salmón Atlántico HG',  56000,  324800000, 'CS-2025-027'),
  ('2025-06-01', 'Unión Europea',  'Filete de Salmón',     50000,  510000000, 'CS-2025-028')
ON CONFLICT (id) DO NOTHING;

-- Lotes detallados (16). Tamaño realista (empresa mediana), biomasa = unidades x peso.
-- Cosechados (ene-jun 2025) alimentan las exportaciones del periodo.
INSERT INTO lotes_detalle (lote_codigo, especie, centro_nombre, fecha_siembra, unidades_sembradas, biomasa_kg, peso_promedio_kg, fcr, estado) VALUES
  ('LOTE-J1', 'Salmón Atlántico', 'Los Lagos', '2023-11-06',  55000, 275000.00, 5.000, 1.31, 'cosechado'),
  ('LOTE-J2', 'Salmón Atlántico', 'Chiloé',   '2023-12-12',  52000, 249600.00, 4.800, 1.30, 'cosechado'),
  ('LOTE-D1', 'Salmón Atlántico', 'Aysén',    '2024-01-15',  60000, 273000.00, 4.550, 1.33, 'cosechado'),
  ('LOTE-D2', 'Salmón Coho',      'Quellón',  '2024-02-05',  70000, 252000.00, 3.600, 1.18, 'cosechado'),
  ('LOTE-E1', 'Salmón Coho',      'Los Lagos', '2024-03-01', 75000, 255000.00, 3.400, 1.16, 'cosechado'),
  ('LOTE-E2', 'Salmón Atlántico', 'Chiloé',   '2023-10-20',  58000, 295800.00, 5.100, 1.34, 'cosechado'),
  ('LOTE-A1', 'Salmón Atlántico', 'Los Lagos', '2024-11-05', 62000, 158100.00, 2.550, 1.24, 'activo'),
  ('LOTE-A2', 'Salmón Atlántico', 'Chiloé',   '2024-12-10', 60000, 126000.00, 2.100, 1.23, 'activo'),
  ('LOTE-B1', 'Salmón Coho',      'Quellón',  '2025-01-15', 68000, 163200.00, 2.400, 1.15, 'activo'),
  ('LOTE-B2', 'Salmón Atlántico', 'Aysén',    '2025-01-20', 58000, 130500.00, 2.250, 1.26, 'activo'),
  ('LOTE-C1', 'Salmón Atlántico', 'Los Lagos', '2025-02-10', 64000, 115200.00, 1.800, 1.21, 'activo'),
  ('LOTE-C2', 'Salmón Coho',      'Chiloé',   '2025-02-25', 70000, 143500.00, 2.050, 1.14, 'activo'),
  ('LOTE-F1', 'Salmón Atlántico', 'Quellón',  '2025-04-08', 60000,  69000.00, 1.150, 1.18, 'activo'),
  ('LOTE-F2', 'Salmón Atlántico', 'Aysén',    '2025-05-19', 55000,  46750.00, 0.850, 1.16, 'activo'),
  ('LOTE-G1', 'Salmón Atlántico', 'Los Lagos', '2025-06-15', 58000,  31900.00, 0.550, 1.12, 'activo'),
  ('LOTE-H1', 'Salmón Coho',      'Quellón',  '2025-07-02', 66000,  27720.00, 0.420, 1.10, 'activo')
ON CONFLICT (lote_codigo) DO NOTHING;

-- Incidentes (18) - referencian lotes reales del esquema
INSERT INTO incidentes (fecha, tipo, severidad, descripcion, accion_tomada, centro_nombre, estado) VALUES
  ('2025-01-08', 'bioseguridad', 'medio', 'Arribo de embarcación de servicio sin completar desinfección del paño antes de entrar a zona de jaulas', 'Capacitación a la tripulación y refuerzo del protocolo de acceso.', 'Quellón', 'resuelto'),
  ('2025-01-19', 'escape',       'alto',  'Rotura parcial de paño de red por fondeo del buque en la jaula del lote J1; escape estimado de 1.400 peces', 'Retiro de la red dañada, recuento de pérdida y reporte a Sernapesca.', 'Los Lagos', 'resuelto'),
  ('2025-02-03', 'sanitario',    'medio', 'Detección de caligus sobre umbral de control en el lote J2 con promedio de 4,2 hembras ovígeras', 'Tratamiento antiparasitario autorizado según Resolución de caligus vigente.', 'Chiloé', 'resuelto'),
  ('2025-02-17', 'ambiental',    'bajo',  'Oxígeno disuelto bajo 5,8 mg/L durante 6 horas en el lote D1 por floración algal incipiente', 'Activación de oxigenación de emergencia y monitoreo horario.', 'Aysén', 'resuelto'),
  ('2025-03-02', 'accidente',    'bajo',  'Operario resbaló en cubierta mojada y sufrió contusión leve en rodilla', 'Atención en enfermería y entrega de calzado con mayor agarre.', 'Quellón', 'resuelto'),
  ('2025-03-15', 'escape',       'critico', 'Falla de traba de jaula en el lote A1 dejó la puerta parcialmente abierta; fuga estimada de 3.200 unidades', 'Reparación por buzo, censo de stock y reporte oficial a Sernapesca.', 'Los Lagos', 'en_seguimiento'),
  ('2025-03-26', 'bioseguridad', 'medio', 'Mortalidad anormal (0,4% en 48 horas) en el lote B2 sin causa clara', 'Activación del protocolo de contingencia sanitaria y notificación a Sernapesca.', 'Aysén', 'resuelto'),
  ('2025-04-09', 'accidente',    'alto',  'Operario de planta sufrió corte en antebrazo al manipular fileteadora', 'Primeros auxilios y derivación a centro asistencial.', 'Quellón', 'resuelto'),
  ('2025-04-20', 'sanitario',    'alto',  'Brote de piscirickettsiosis (SRS) en el lote B2 que elevó la mortalidad acumulada a 12,9%', 'Tratamiento con florfenicol autorizado por Sernapesca y cuarentena del lote.', 'Aysén', 'en_seguimiento'),
  ('2025-05-02', 'escape',       'alto',  'El buzo de revisión detectó enmallado de red con riesgo de fuga en el lote C2', 'Refuerzo de la red con paño de repuesto y verificación por buceo.', 'Chiloé', 'resuelto'),
  ('2025-05-11', 'bioseguridad', 'bajo',  'Visita de la empresa vacunadora llegó al centro sin registrar su ingreso en la bitácora', 'Regularización del registro y recordatorio del protocolo de acceso.', 'Los Lagos', 'resuelto'),
  ('2025-05-23', 'accidente',    'medio', 'Buzo presentó otitis por presión durante mantención de red del lote A2', 'Suspensión de la faena y derivación al médico laboral.', 'Chiloé', 'resuelto'),
  ('2025-06-01', 'ambiental',    'medio', 'Floración algal en el seno colindante al centro con riesgo de desoxigenación del lote G1', 'Incremento del monitoreo y oxigenación preventiva.', 'Los Lagos', 'resuelto'),
  ('2025-06-14', 'sanitario',    'bajo',  'Detección de caligus bajo umbral de control en el lote C1', 'Monitoreo reforzado; no requirió tratamiento.', 'Los Lagos', 'resuelto'),
  ('2025-06-28', 'escape',       'critico', 'La puerta de muestreo quedó abierta y se estima una fuga de 2.100 peces del lote F1', 'Censo al día siguiente y cambio del procedimiento de muestreo.', 'Quellón', 'abierto'),
  ('2025-07-05', 'accidente',    'alto',  'Operario sufrió fractura de muñeca al caer desde la escala de la balsa-metralla', 'Traslado a urgencia, investigación del accidente y revisión de la escala.', 'Chiloé', 'abierto'),
  ('2025-07-18', 'bioseguridad', 'medio', 'Mortalidad anormal en el borde de red del lote F2', 'Extracción de mortalidades, revisión de red y control veterinario.', 'Aysén', 'resuelto'),
  ('2025-08-01', 'ambiental',    'alto',  'Floración algal con desoxigenación en la jaula del lote B1 del Centro Quellón', 'Oxigenación intensiva y programación de cosecha parcial de emergencia.', 'Quellón', 'en_seguimiento')
ON CONFLICT (id) DO NOTHING;

-- Concesiones acuícolas (4 centros)
INSERT INTO concesiones (centro_nombre, sector, region, latitude, longitude, superficie_ha, n_jaulas, especies_autorizadas, vigencia) VALUES
  ('Centro Los Lagos', 'Seno Reloncaví',        'Los Lagos (X)', -41.583333, -72.816667, 16.50, 12, 'Salmón Atlántico, Salmón Coho', 'Vigente hasta 2032'),
  ('Centro Chiloé',    'Sector Queullín',       'Los Lagos (X)', -42.116667, -73.466667, 14.20, 10, 'Salmón Atlántico, Salmón Coho', 'Vigente hasta 2031'),
  ('Centro Quellón',   'Canal Apiao',           'Los Lagos (X)', -43.250000, -73.616667, 12.80, 10, 'Salmón Atlántico, Salmón Coho', 'Vigente hasta 2033'),
  ('Centro Aysén',     'Canal Puyuhuapi',       'Aysén (XI)',    -44.300000, -72.500000, 18.00, 14, 'Salmón Atlántico, Salmón Coho, Trucha', 'Vigente hasta 2030')
ON CONFLICT (centro_nombre) DO NOTHING;

-- Monitoreo sanitario/ambiental mensual por lote activo (abril a julio 2025).
-- Caligus en hembras ovígeras promedio (indicador de control normativo),
-- temperatura del agua, oxígeno disuelto y mortalidad del mes.
INSERT INTO monitoreo_sanitario (lote_codigo, mes, caligus_hembras_ovigeras_prom, temperatura_c, oxigeno_mg_l, mortalidad_mes) VALUES
  ('LOTE-A1', '2025-04-01', 1.20, 11.8, 7.9, 420),
  ('LOTE-A1', '2025-05-01', 2.10, 11.2, 7.6, 510),
  ('LOTE-A1', '2025-06-01', 3.40, 10.4, 7.0, 640),
  ('LOTE-A1', '2025-07-01', 4.10,  9.6, 6.8, 590),
  ('LOTE-A2', '2025-04-01', 0.80, 12.0, 8.1, 380),
  ('LOTE-A2', '2025-05-01', 1.90, 11.4, 7.8, 440),
  ('LOTE-A2', '2025-06-01', 2.60, 10.6, 7.2, 490),
  ('LOTE-A2', '2025-07-01', 3.10,  9.8, 6.9, 460),
  ('LOTE-B1', '2025-04-01', 2.40, 11.5, 7.5, 510),
  ('LOTE-B1', '2025-05-01', 3.80, 10.9, 7.1, 580),
  ('LOTE-B1', '2025-06-01', 5.20, 10.2, 6.4, 720),
  ('LOTE-B1', '2025-07-01', 6.50,  9.5, 6.1, 860),
  ('LOTE-B2', '2025-04-01', 1.50, 11.0, 6.3, 1800),
  ('LOTE-B2', '2025-05-01', 2.20, 10.5, 6.1, 1420),
  ('LOTE-B2', '2025-06-01', 2.80,  9.9, 6.5, 980),
  ('LOTE-B2', '2025-07-01', 3.30,  9.2, 6.8, 760),
  ('LOTE-C1', '2025-04-01', 0.60, 11.6, 7.9, 320),
  ('LOTE-C1', '2025-05-01', 1.10, 11.1, 7.7, 370),
  ('LOTE-C1', '2025-06-01', 2.00, 10.3, 7.3, 410),
  ('LOTE-C1', '2025-07-01', 2.60,  9.7, 7.0, 390),
  ('LOTE-C2', '2025-04-01', 1.90, 11.7, 7.8, 450),
  ('LOTE-C2', '2025-05-01', 3.10, 11.0, 7.4, 520),
  ('LOTE-C2', '2025-06-01', 4.40, 10.3, 6.9, 610),
  ('LOTE-C2', '2025-07-01', 5.00,  9.6, 6.6, 580),
  ('LOTE-F1', '2025-05-01', 0.70, 11.3, 7.6, 300),
  ('LOTE-F1', '2025-06-01', 1.30, 10.5, 7.2, 350),
  ('LOTE-F1', '2025-07-01', 1.90,  9.8, 6.9, 330),
  ('LOTE-F2', '2025-06-01', 0.50, 10.4, 7.4, 240),
  ('LOTE-F2', '2025-07-01', 0.90,  9.6, 7.1, 270)
ON CONFLICT (lote_codigo, mes) DO NOTHING;

-- Alimentación: raciones mensuales (kg y costo) por lote activo
INSERT INTO alimentacion (lote_codigo, mes, tipo_alimento, kg_entregados, costo_clp) VALUES
  ('LOTE-A1', '2025-04-01', 'Extruido 9mm',  92000,  80960000),
  ('LOTE-A1', '2025-05-01', 'Extruido 9mm', 105000,  92400000),
  ('LOTE-A1', '2025-06-01', 'Extruido 9mm', 117000, 102960000),
  ('LOTE-A1', '2025-07-01', 'Extruido 9mm', 124000, 109120000),
  ('LOTE-A2', '2025-04-01', 'Extruido 6mm',  81000,  74520000),
  ('LOTE-A2', '2025-05-01', 'Extruido 6mm',  93000,  85560000),
  ('LOTE-A2', '2025-06-01', 'Extruido 9mm', 104000,  91520000),
  ('LOTE-A2', '2025-07-01', 'Extruido 9mm', 112000,  98560000),
  ('LOTE-B1', '2025-04-01', 'Extruido 6mm',  88000,  80960000),
  ('LOTE-B1', '2025-05-01', 'Extruido 6mm', 98000,  90160000),
  ('LOTE-B1', '2025-06-01', 'Extruido 6mm', 109000, 100280000),
  ('LOTE-B1', '2025-07-01', 'Extruido 6mm', 118000, 108560000),
  ('LOTE-B2', '2025-04-01', 'Extruido 6mm',  76000,  69920000),
  ('LOTE-B2', '2025-05-01', 'Extruido 6mm',  86000,  79120000),
  ('LOTE-B2', '2025-06-01', 'Extruido 6mm',  95000,  87400000),
  ('LOTE-B2', '2025-07-01', 'Extruido 6mm', 102000,  93840000),
  ('LOTE-C1', '2025-04-01', 'Extruido 3mm',  58000,  55100000),
  ('LOTE-C1', '2025-05-01', 'Extruido 3mm',  69000,  65550000),
  ('LOTE-C1', '2025-06-01', 'Extruido 6mm',  79000,  72680000),
  ('LOTE-C1', '2025-07-01', 'Extruido 6mm',  87000,  80040000),
  ('LOTE-C2', '2025-04-01', 'Extruido 3mm',  62000,  58900000),
  ('LOTE-C2', '2025-05-01', 'Extruido 3mm',  72000,  68400000),
  ('LOTE-C2', '2025-06-01', 'Extruido 6mm',  82000,  75440000),
  ('LOTE-C2', '2025-07-01', 'Extruido 6mm',  89000,  81880000),
  ('LOTE-F1', '2025-05-01', 'Extruido 3mm',  31000,  29450000),
  ('LOTE-F1', '2025-06-01', 'Extruido 3mm',  40000,  38000000),
  ('LOTE-F1', '2025-07-01', 'Extruido 3mm',  48000,  45600000),
  ('LOTE-F2', '2025-06-01', 'Premolido 2mm', 18000,  17820000),
  ('LOTE-F2', '2025-07-01', 'Premolido 2mm', 24000,  23760000)
ON CONFLICT (id) DO NOTHING;

-- Clientes vigentes
INSERT INTO clientes (nombre, pais, contacto, producto_principal, condiciones_pago, contrato_tipo) VALUES
  ('Seafood Partners LLC',   'Estados Unidos', 'Emily Carter, compradora senior', 'Salmón Atlántico HG congelado', 'Crédito 45 días', 'Contrato anual 2025-2026'),
  ('Nippon Marine Trading',  'Japón',          'Kenji Tanaka, gerente de importación', 'Salmón Coho entero fresco', 'Crédito 60 días', 'Contrato anual 2025'),
  ('NordInter Food',         'Unión Europea',  'Lars Jørgensen, director comercial', 'Filete de Salmón Atlántico', 'Crédito 30 días', 'Contrato semestral 2025-S2'),
  ('Brasil Mar S.A.',        'Brasil',         'Carla Mendes, compradora', 'Salmón Atlántico HG congelado', 'Crédito 30 días', 'Contrato spot con volumen mínimo'),
  ('Shanghai Aquatic Group', 'China',          'Wei Zhang, account manager', 'Salmón Coho entero congelado', 'Crédito 45 días', 'Acuerdo marco 2025-2026'),
  ('Supermercados del Sur',  'Chile',          'Rodrigo Salinas, jefe de compras', 'Salmón fresco nacional (pieza y HG)', 'Crédito 15 días', 'Contrato de distribución nacional')
ON CONFLICT (id) DO NOTHING;