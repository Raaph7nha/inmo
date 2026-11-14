-- ============================================================================
-- HABITABOGOTÁ — Seed con usuario admin y 20 viviendas con coordenadas reales de Bogotá
-- ============================================================================

TRUNCATE TABLE chat_mensajes, mensajes_soporte, alertas, comparador, guardados, puntos_interes, imagenes_vivienda, viviendas, usuarios RESTART IDENTITY CASCADE;

-- Insertar usuario administrador y comprador demo (Contraseña por defecto: Admin1234!)
INSERT INTO usuarios (id, nombre, correo, contrasena_hash, rol, verificado) VALUES
(1, 'Administrador HabitaBogotá', 'admin@habi.co', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J2K1v1lre', 'admin', true),
(2, 'Valeria Ramírez', 'valeria@habi.co', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J2K1v1lre', 'comprador', true);

SELECT setval(pg_get_serial_sequence('usuarios', 'id'), (SELECT MAX(id) FROM usuarios));

INSERT INTO viviendas (
  id, propietario_id, titulo, descripcion, tipo, operacion, barrio, localidad, direccion_aprox,
  precio, administracion, habitaciones, banos, area_m2,
  mascotas, parqueadero, balcon, gimnasio, piscina, porteria, tour_3d,
  requisitos, deposito, pos_x, pos_y, lat, lng, destacado, creado_en, actualizado_en
) VALUES
(
  1, 1,
  'Apartamento Iluminado con Balcón y Vista a Cerros',
  'Apartamento con vista franca hacia la cordillera oriental andina. Pisos en madera laminada de alto tráfico, cocina integral abierta con mesón en granito y barra de desayuno. Ubicación ideal cerca a las universidades Javeriana y Piloto.',
  'apartamento', 'arriendo', 'Chapinero Alto', 'Chapinero', 'Cl. 63 # 4-82',
  2400000, 350000, 2, 2, 68.0,
  true, true, true, true, false, true, true,
  ARRAY['Ingresos 2.5x costo total', 'Cédula vigente', '1 codeudor o fianza digital', 'Póliza estudio aseguradora 5% + IVA'],
  NULL, 73.0, 40.0, 4.648600, -74.058800, true, '2026-10-18T10:00:00Z', '2026-10-18T10:00:00Z'
),
(
  2, 1,
  'Apartamento Clásico Remodelado en Quinta Camacho',
  'Espacios generosos y techos altos en el barrio patrimonial de Quinta Camacho. Chimenea tradicional en ladrillo a la vista, estudio independiente en nogal y zona de lavandería aireada.',
  'apartamento', 'arriendo', 'Quinta Camacho', 'Chapinero', 'Cra. 10A # 69-35',
  3100000, 420000, 3, 2, 92.0,
  true, true, true, false, false, true, true,
  ARRAY['Ingresos 3x costo total', 'Cédula vigente', 'Codeudor con solvencia laboral', 'Seguro de arrendamiento'],
  NULL, 71.0, 36.0, 4.654200, -74.059500, false, '2026-10-20T10:00:00Z', '2026-10-20T10:00:00Z'
),
(
  3, 1,
  'Apartamento Art Déco frente al Park Way',
  'Para quienes disfrutan la vida de barrio y la cultura. Edificio emblemático estilo Art Déco conservado con ventanales acústicos, a pocos pasos de librerías, cafés de especialidad y teatros.',
  'apartamento', 'arriendo', 'La Soledad', 'Teusaquillo', 'Cra. 21 # 39B-12',
  1850000, 180000, 2, 1, 60.0,
  true, false, false, false, false, true, false,
  ARRAY['Ingresos 2.5x costo total', 'Cédula o pasaporte', 'Póliza digital sin finca raíz', 'Certificado laboral o extractos'],
  NULL, 58.0, 56.0, 4.628800, -74.072500, false, '2026-10-21T10:00:00Z', '2026-10-21T10:00:00Z'
),
(
  4, 1,
  'Casa Señorial de Dos Plantas en Galerías',
  'Casa independiente sin cuota de administración. Jardín interior privado, garaje para dos vehículos, amplias estancias familiares y cocina tradicional con despensa. Ideal para familia o estudio creativo.',
  'casa', 'arriendo', 'Galerías', 'Teusaquillo', 'Cl. 53A # 25-18',
  4200000, 0, 4, 3, 180.0,
  true, true, true, false, false, false, false,
  ARRAY['Ingresos 3x canon', 'Codeudor con finca raíz o póliza', 'Extractos últimos 3 meses', 'Contrato mínimo 12 meses'],
  NULL, 55.0, 48.0, 4.642300, -74.075100, false, '2026-10-15T10:00:00Z', '2026-10-15T10:00:00Z'
),
(
  5, 1,
  'Apartamento Club House Santa Bárbara',
  'Conjunto cerrado de alta categoría con piscina cubierta climatizada, sauna, turco, gimnasio dotado, salón social y parque infantil privado. Acabados importados y dos parqueaderos independientes.',
  'apartamento', 'venta', 'Santa Bárbara', 'Usaquén', 'Cra. 12 # 118-40',
  620000000, 550000, 3, 3, 115.0,
  true, true, true, true, true, true, true,
  ARRAY['Promesa de compraventa', 'Certificado de tradición y libertad', 'Preaprobado hipotecario o recursos propios', 'Paz y salvo de administración'],
  NULL, 77.0, 22.0, 4.698900, -74.041200, false, '2026-10-19T10:00:00Z', '2026-10-19T10:00:00Z'
),
(
  6, 1,
  'Apartamento Iluminado con Terraza en Cedritos',
  'Apartamento exterior orientado al poniente con excelente iluminación natural. Terraza privada para plantas y descanso, cocina tipo americano y habitación principal con baño en suite y vestier.',
  'apartamento', 'arriendo', 'Cedritos', 'Usaquén', 'Cl. 142 # 16-55',
  1750000, 240000, 2, 2, 72.0,
  false, true, true, true, false, true, true,
  ARRAY['Ingresos 2.5x costo total', 'Cédula vigente', '1 codeudor o fianza digital', 'No se permiten mascotas en este contrato'],
  NULL, 79.0, 15.0, 4.721500, -74.039800, false, '2026-10-22T10:00:00Z', '2026-10-22T10:00:00Z'
),
(
  7, 1,
  'Casa Familiar Residencial en Modelia',
  'Propiedad de dos pisos con antejardín cercado. Primer nivel con sala, comedor, estudio, cocina amplia y patio de ropas semicubierto. Segundo nivel con 3 alcobas y excelente acceso a Av. El Dorado.',
  'casa', 'venta', 'Modelia', 'Fontibón', 'Cra. 75 # 24C-30',
  480000000, 90000, 3, 2, 140.0,
  true, true, true, false, false, false, false,
  ARRAY['Escritura pública y tradición al día', 'Estudio de títulos', 'Crédito hipotecario o leasing habitacional'],
  NULL, 34.0, 57.0, 4.666200, -74.120400, false, '2026-10-12T10:00:00Z', '2026-10-12T10:00:00Z'
),
(
  8, 1,
  'Apartamento Familiar en Ciudad Salitre',
  'Ubicación estratégica en el centro geográfico de Bogotá con rápido acceso al aeropuerto y centros empresariales. Conjunto con cancha de squash, sendero peatonal, gimnasio y piscina climatizada.',
  'apartamento', 'arriendo', 'Ciudad Salitre', 'Fontibón', 'Av. La Esperanza # 68B-45',
  2800000, 380000, 3, 2, 85.0,
  true, true, false, true, true, true, true,
  ARRAY['Ingresos 2.5x costo total', 'Cédula vigente', 'Póliza SURA / El Libertador', 'Certificado laboral o renta'],
  NULL, 42.0, 59.0, 4.658400, -74.107200, false, '2026-10-21T10:00:00Z', '2026-10-21T10:00:00Z'
),
(
  9, 1,
  'Apartamento Práctico y Económico en Castilla',
  'Costo accesible con administración económica en conjunto cerrado. 3 habitaciones con clósets modulares, cocina integral con gas natural y pisos cerámicos de fácil mantenimiento.',
  'apartamento', 'arriendo', 'Castilla', 'Kennedy', 'Cl. 8 # 78-20',
  1250000, 130000, 3, 1, 55.0,
  true, false, false, false, false, true, false,
  ARRAY['Ingresos 2x costo total', 'Cédula vigente', 'Codeudor laboral o fianza digital', 'Extractos bancarios 3 meses'],
  NULL, 26.0, 76.0, 4.640800, -74.142200, false, '2026-10-17T10:00:00Z', '2026-10-17T10:00:00Z'
),
(
  10, 1,
  'Apartamento con Vista Panorámica Colina Campestre',
  'Piso 11 con vista abierta hacia la sabana norte y los atardeceres bogotanos. Balcón amplio con punto de gas, cocina integral con isla central, parqueadero cubierto y zonas húmedas.',
  'apartamento', 'arriendo', 'Colina Campestre', 'Suba', 'Cl. 138 # 55-40',
  2600000, 340000, 3, 2, 88.0,
  true, true, true, true, true, true, true,
  ARRAY['Ingresos 2.5x costo total', 'Cédula vigente', 'Seguro de arrendamiento digital', 'Carnet de vacunas si tienes mascota'],
  NULL, 62.0, 14.0, 4.724800, -74.062300, false, '2026-10-22T10:00:00Z', '2026-10-22T10:00:00Z'
),
(
  11, 1,
  'Loft Universitario Colonial en La Candelaria',
  'Loft con vigas de madera a la vista y balcón de baranda republicana sobre calle empedrada. A pocos minutos a pie de las universidades de Los Andes, Externado, Rosario y América.',
  'apartamento', 'arriendo', 'La Candelaria', 'La Candelaria', 'Cl. 11 # 3-45',
  1550000, 120000, 1, 1, 48.0,
  true, false, true, false, false, true, true,
  ARRAY['Ingresos 2.5x costo total o responsable académico', 'Cédula o carnet universitario + codeudor', 'Fianza digital en línea'],
  NULL, 65.0, 79.0, 4.596800, -74.071500, false, '2026-10-23T10:00:00Z', '2026-10-23T10:00:00Z'
),
(
  12, 1,
  'Local Comercial con Vitrina en Polo Club',
  'Local sobre vía arterial con vitrina panorámica de piso a techo. Espacio abierto adaptable para consultorio, estudio de diseño, cafetería o showroom. Dos baños y parqueadero para clientes.',
  'local', 'arriendo', 'Polo Club', 'Barrios Unidos', 'Autopista Norte # 84-15',
  3500000, 250000, 1, 2, 110.0,
  false, true, false, false, false, false, false,
  ARRAY['RUT y Cámara de Comercio', 'Estados financieros o extractos', 'Codeudor con finca raíz o póliza comercial', 'Depósito comercial en garantía'],
  3500000, 60.0, 34.0, 4.671200, -74.060900, false, '2026-10-14T10:00:00Z', '2026-10-14T10:00:00Z'
),
(
  13, 1,
  'Penthouse Lujoso en Rosales con Vista Exclusiva',
  'Exclusivo penthouse con terraza panorámica de 40m², chimenea a gas, acabados en mármol italiano y ascensor privado directo al apartamento. Seguridad 24/7 y circuito cerrado.',
  'apartamento', 'venta', 'Rosales', 'Chapinero', 'Cra. 3 # 72-10',
  950000000, 850000, 3, 4, 160.0,
  true, true, true, true, true, true, true,
  ARRAY['Estudio de títulos', 'Crédito hipotecario aprobado o recursos propios', 'Certificado de tradición y libertad'],
  NULL, 74.0, 42.0, 4.632100, -74.051200, true, '2026-10-24T10:00:00Z', '2026-10-24T10:00:00Z'
),
(
  14, 1,
  'Casa Campestre Urbana en San José de Bavaria',
  'Hermosa casa rodeada de jardines privados y árboles nativos dentro de sector residencial tranquilo. Chimenea, estudio, sala doble altura, BBQ y 4 parqueaderos.',
  'casa', 'arriendo', 'San José de Bavaria', 'Suba', 'Cl. 170 # 54-20',
  5500000, 400000, 4, 4, 210.0,
  true, true, true, false, false, true, false,
  ARRAY['Ingresos 3x costo total', 'Póliza de arrendamiento', 'Codeudor con finca raíz'],
  NULL, 64.0, 12.0, 4.745100, -74.060200, false, '2026-10-25T10:00:00Z', '2026-10-25T10:00:00Z'
),
(
  15, 1,
  'Apartamento Ejecutivo en Chicó Norte',
  'Práctico apartamento amoblado y equipado con diseño moderno. Cerca a parques ecológicos, zona rosa y vías principales como la Cra 11 y Calle 94.',
  'apartamento', 'arriendo', 'Chicó Norte', 'Chapinero', 'Cra. 13 # 93-22',
  2900000, 320000, 1, 2, 52.0,
  false, true, true, true, false, true, true,
  ARRAY['Ingresos 2.5x costo total', 'Cédula vigente', 'Fianza digital'],
  NULL, 72.0, 30.0, 4.678200, -74.049100, false, '2026-10-26T10:00:00Z', '2026-10-26T10:00:00Z'
),
(
  16, 1,
  'Local Comercial Esquinero en Chapinero Central',
  'Excelente punto comercial con alto flujo peatonal y vehicular. Doble altura, baño privado, cortina metálica automatizada y excelente iluminación.',
  'local', 'arriendo', 'Chapinero Central', 'Chapinero', 'Cra. 13 # 57-15',
  3800000, 200000, 1, 2, 95.0,
  false, true, false, false, false, false, false,
  ARRAY['RUT y Cámara de Comercio', 'Estados financieros', 'Codeudor comercial'],
  3800000, 70.0, 41.0, 4.639100, -74.064500, false, '2026-10-27T10:00:00Z', '2026-10-27T10:00:00Z'
),
(
  17, 1,
  'Casa Tradicional Estilo Inglés en La Macarena',
  'Encantadora casa de tres niveles con buhardilla, patio interior con enredaderas y pisos en madera original. A pasos de los mejores restaurantes de la Macarena y el Museo de Arte Moderno.',
  'casa', 'arriendo', 'La Macarena', 'Santa Fe', 'Cl. 26B # 4A-12',
  3600000, 0, 3, 2, 130.0,
  true, false, true, false, false, false, true,
  ARRAY['Ingresos 3x canon', 'Codeudor solvente', 'Póliza digital'],
  NULL, 66.0, 75.0, 4.613500, -74.068200, false, '2026-10-28T10:00:00Z', '2026-10-28T10:00:00Z'
),
(
  18, 1,
  'Apartamento Moderno en Santa Teresita',
  'Apartamento exterior muy iluminado, con cocina abierta, zona de lavandería independiente y excelente ubicación cerca a la Universidad Javeriana y Hospital San Ignacio.',
  'apartamento', 'arriendo', 'Santa Teresita', 'Santa Fe', 'Cra. 5 # 45-30',
  2100000, 280000, 2, 2, 64.0,
  true, true, false, false, false, true, false,
  ARRAY['Ingresos 2.5x costo total', 'Cédula', 'Fianza digital'],
  NULL, 68.0, 50.0, 4.619200, -74.065400, false, '2026-10-29T10:00:00Z', '2026-10-29T10:00:00Z'
),
(
  19, 1,
  'Apartamento Familiar con Piscina en Hayuelos',
  'Amplio apartamento en conjunto cerrado con club house completo: piscinas, canchas múltiples, gimnasio y zonas verdes. Tres habitaciones con excelente vista interior.',
  'apartamento', 'arriendo', 'Hayuelos', 'Fontibón', 'Cl. 19A # 82-45',
  2750000, 350000, 3, 2, 82.0,
  true, true, true, true, true, true, true,
  ARRAY['Ingresos 2.5x costo total', 'Cédula', 'Póliza de arrendamiento'],
  NULL, 30.0, 60.0, 4.671200, -74.135400, false, '2026-10-30T10:00:00Z', '2026-10-30T10:00:00Z'
),
(
  20, 1,
  'Penthouse Dúplex Exclusivo en El Nogal',
  'Lujoso penthouse dúplex con terraza privada, chimenea, estudio, acabados de alta gama y domótica integrada. Edificio con seguridad privada y planta eléctrica total.',
  'apartamento', 'venta', 'El Nogal', 'Chapinero', 'Cra. 9 # 79-50',
  1250000000, 600000, 4, 4, 195.0,
  true, true, true, true, true, true, true,
  ARRAY['Estudio de títulos', 'Crédito hipotecario o recursos propios'],
  NULL, 73.0, 38.0, 4.661200, -74.053400, true, '2026-10-31T10:00:00Z', '2026-10-31T10:00:00Z'
);

SELECT setval(pg_get_serial_sequence('viviendas', 'id'), (SELECT MAX(id) FROM viviendas));

-- Imágenes de vivienda (1 a 20)
INSERT INTO imagenes_vivienda (vivienda_id, cloudinary_public_id, url, url_thumb, orden) VALUES
(1, 'demo_1_1', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80', 1),
(2, 'demo_2_1', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80', 1),
(3, 'demo_3_1', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=400&q=80', 1),
(4, 'demo_4_1', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80', 1),
(5, 'demo_5_1', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80', 1),
(6, 'demo_6_1', 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=400&q=80', 1),
(7, 'demo_7_1', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80', 1),
(8, 'demo_8_1', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80', 1),
(9, 'demo_9_1', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80', 1),
(10, 'demo_10_1', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80', 1),
(11, 'demo_11_1', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=400&q=80', 1),
(12, 'demo_12_1', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80', 1),
(13, 'demo_13_1', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80', 1),
(14, 'demo_14_1', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80', 1),
(15, 'demo_15_1', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80', 1),
(16, 'demo_16_1', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80', 1),
(17, 'demo_17_1', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80', 1),
(18, 'demo_18_1', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80', 1),
(19, 'demo_19_1', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80', 1),
(20, 'demo_20_1', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80', 1);

-- Puntos de interés (1 a 20)
INSERT INTO puntos_interes (vivienda_id, categoria, nombre, lat, lng, distancia_cuadras) VALUES
(1, 'transporte', 'Estación Cl. 63 (TransMilenio)', 4.648600, -74.058800, 3),
(1, 'supermercado', 'Éxito Calle 63', 4.649000, -74.059000, 2),
(2, 'transporte', 'Estación Flores (TransMilenio)', 4.654200, -74.059500, 4),
(3, 'transporte', 'Estación Av. 39', 4.628800, -74.072500, 5),
(4, 'transporte', 'Estación Campín', 4.642300, -74.075100, 4),
(5, 'transporte', 'Estación Pepe Sierra', 4.698900, -74.041200, 5),
(6, 'transporte', 'Estación Alcalá', 4.721500, -74.039800, 1),
(7, 'transporte', 'Estación Av. Rojas', 4.666200, -74.120400, 6),
(8, 'transporte', 'Estación Salitre El Greco', 4.658400, -74.107200, 4),
(9, 'transporte', 'Estación Banderas', 4.640800, -74.142200, 7),
(10, 'transporte', 'Estación 21 Ángeles', 4.724800, -74.062300, 2),
(11, 'transporte', 'Estación Las Aguas', 4.596800, -74.071500, 3),
(12, 'transporte', 'Estación Polo', 4.671200, -74.060900, 2),
(13, 'transporte', 'Estación Calle 72', 4.657200, -74.058900, 3),
(14, 'transporte', 'Portal Norte', 4.752100, -74.051200, 8),
(15, 'transporte', 'Estación Calle 92', 4.678200, -74.049100, 2),
(16, 'transporte', 'Estación Calle 57', 4.639100, -74.064500, 1),
(17, 'transporte', 'Estación Universidades', 4.601200, -74.069100, 4),
(18, 'transporte', 'Estación Calle 45', 4.629100, -74.068200, 2),
(19, 'transporte', 'Portal El Dorado', 4.670100, -74.132100, 5),
(20, 'transporte', 'Estación Calle 76', 4.661200, -74.053400, 3);

-- Migración de respaldo desde tabla vieja inmuebles si existiera
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inmuebles') THEN
    INSERT INTO viviendas (
      titulo, descripcion, tipo, operacion, barrio, localidad, ciudad,
      direccion_aprox, precio, administracion, deposito, habitaciones, banos,
      area_m2, mascotas, parqueadero, balcon, gimnasio, piscina, porteria,
      tour_3d, lat, lng, destacado, activo
    )
    SELECT
      titulo, descripcion, tipo, operacion, barrio, 
      COALESCE(localidad, barrio), 'Bogotá',
      COALESCE(direccion_aprox, barrio || ', Bogotá'),
      precio, COALESCE(administracion, 0), deposito,
      COALESCE(habitaciones, 1), COALESCE(banos, 1), COALESCE(area_m2, 50),
      COALESCE(mascotas, false), COALESCE(parqueadero, false),
      COALESCE(balcon, false), COALESCE(gimnasio, false),
      COALESCE(piscina, false), COALESCE(porteria, false),
      COALESCE(tour_3d, false),
      COALESCE(lat, 4.6482 + (random()-0.5)*0.08),
      COALESCE(lng, -74.1002 + (random()-0.5)*0.08),
      COALESCE(destacado, false), true
    FROM inmuebles
    WHERE NOT EXISTS (SELECT 1 FROM viviendas WHERE viviendas.titulo = inmuebles.titulo);
  END IF;
END $$;

