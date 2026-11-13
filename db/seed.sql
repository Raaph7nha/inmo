-- ============================================================================
-- HABITABOGOTÁ — Datos iniciales (12 inmuebles realistas en Bogotá D.C.)
-- Localidades: Chapinero, Teusaquillo, Usaquén, Fontibón, Kennedy, Suba,
-- La Candelaria y Barrios Unidos.
-- ============================================================================

TRUNCATE TABLE chat_mensajes, mensajes_soporte, alertas, comparador, guardados, sesiones, puntos_interes, imagenes, inmuebles RESTART IDENTITY CASCADE;

INSERT INTO inmuebles (
  id, titulo, descripcion, tipo, operacion, barrio, localidad, direccion_aprox,
  precio, administracion, habitaciones, banos, area_m2,
  mascotas, parqueadero, balcon, gimnasio, piscina, porteria, tour_3d,
  requisitos, deposito, pos_x, pos_y, lat, lng, destacado, creado_en, actualizado_en
) VALUES
(
  1,
  'Apartamento Iluminado con Balcón y Vista a Cerros',
  'Apartamento con vista franca hacia la cordillera oriental andina. Pisos en madera laminada de alto tráfico, cocina integral abierta con mesón en granito y barra de desayuno. Ubicación ideal cerca a las universidades Javeriana y Piloto.',
  'apartamento', 'arriendo', 'Chapinero Alto', 'Chapinero', 'Cl. 63 # 4-82',
  2400000, 350000, 2, 2, 68.0,
  true, true, true, true, false, true, true,
  ARRAY['Ingresos 2.5x costo total', 'Cédula vigente', '1 codeudor o fianza digital', 'Póliza estudio aseguradora 5% + IVA'],
  NULL, 73.0, 40.0, 4.648600, -74.058800, true, '2026-10-18T10:00:00Z', '2026-10-18T10:00:00Z'
),
(
  2,
  'Apartamento Clásico Remodelado en Quinta Camacho',
  'Espacios generosos y techos altos en el barrio patrimonial de Quinta Camacho. Chimenea tradicional en ladrillo a la vista, estudio independiente en nogal y zona de lavandería aireada.',
  'apartamento', 'arriendo', 'Quinta Camacho', 'Chapinero', 'Cra. 10A # 69-35',
  3100000, 420000, 3, 2, 92.0,
  true, true, true, false, false, true, true,
  ARRAY['Ingresos 3x costo total', 'Cédula vigente', 'Codeudor con solvencia laboral', 'Seguro de arrendamiento'],
  NULL, 71.0, 36.0, 4.654200, -74.059500, false, '2026-10-20T10:00:00Z', '2026-10-20T10:00:00Z'
),
(
  3,
  'Apartamento Art Déco frente al Park Way',
  'Para quienes disfrutan la vida de barrio y la cultura. Edificio emblemático estilo Art Déco conservado con ventanales acústicos, a pocos pasos de librerías, cafés de especialidad y teatros.',
  'apartamento', 'arriendo', 'La Soledad', 'Teusaquillo', 'Cra. 21 # 39B-12',
  1850000, 180000, 2, 1, 60.0,
  true, false, false, false, false, true, false,
  ARRAY['Ingresos 2.5x costo total', 'Cédula o pasaporte', 'Póliza digital sin finca raíz', 'Certificado laboral o extractos'],
  NULL, 58.0, 56.0, 4.628800, -74.072500, false, '2026-10-21T10:00:00Z', '2026-10-21T10:00:00Z'
),
(
  4,
  'Casa Señorial de Dos Plantas en Galerías',
  'Casa independiente sin cuota de administración. Jardín interior privado, garaje para dos vehículos, amplias estancias familiares y cocina tradicional con despensa. Ideal para familia o estudio creativo.',
  'casa', 'arriendo', 'Galerías', 'Teusaquillo', 'Cl. 53A # 25-18',
  4200000, 0, 4, 3, 180.0,
  true, true, true, false, false, false, false,
  ARRAY['Ingresos 3x canon', 'Codeudor con finca raíz o póliza', 'Extractos últimos 3 meses', 'Contrato mínimo 12 meses'],
  NULL, 55.0, 48.0, 4.642300, -74.075100, false, '2026-10-15T10:00:00Z', '2026-10-15T10:00:00Z'
),
(
  5,
  'Apartamento Club House Santa Bárbara',
  'Conjunto cerrado de alta categoría con piscina cubierta climatizada, sauna, turco, gimnasio dotado, salón social y parque infantil privado. Acabados importados y dos parqueaderos independientes.',
  'apartamento', 'venta', 'Santa Bárbara', 'Usaquén', 'Cra. 12 # 118-40',
  620000000, 550000, 3, 3, 115.0,
  true, true, true, true, true, true, true,
  ARRAY['Promesa de compraventa', 'Certificado de tradición y libertad', 'Preaprobado hipotecario o recursos propios', 'Paz y salvo de administración'],
  NULL, 77.0, 22.0, 4.698900, -74.041200, false, '2026-10-19T10:00:00Z', '2026-10-19T10:00:00Z'
),
(
  6,
  'Apartamento Iluminado con Terraza en Cedritos',
  'Apartamento exterior orientado al poniente con excelente iluminación natural. Terraza privada para plantas y descanso, cocina tipo americano y habitación principal con baño en suite y vestier.',
  'apartamento', 'arriendo', 'Cedritos', 'Usaquén', 'Cl. 142 # 16-55',
  1750000, 240000, 2, 2, 72.0,
  false, true, true, true, false, true, true,
  ARRAY['Ingresos 2.5x costo total', 'Cédula vigente', '1 codeudor o fianza digital', 'No se permiten mascotas en este contrato'],
  NULL, 79.0, 15.0, 4.721500, -74.039800, false, '2026-10-22T10:00:00Z', '2026-10-22T10:00:00Z'
),
(
  7,
  'Casa Familiar Residencial en Modelia',
  'Propiedad de dos pisos con antejardín cercado. Primer nivel con sala, comedor, estudio, cocina amplia y patio de ropas semicubierto. Segundo nivel con 3 alcobas y excelente acceso a Av. El Dorado.',
  'casa', 'venta', 'Modelia', 'Fontibón', 'Cra. 75 # 24C-30',
  480000000, 90000, 3, 2, 140.0,
  true, true, true, false, false, false, false,
  ARRAY['Escritura pública y tradición al día', 'Estudio de títulos', 'Crédito hipotecario o leasing habitacional'],
  NULL, 34.0, 57.0, 4.666200, -74.120400, false, '2026-10-12T10:00:00Z', '2026-10-12T10:00:00Z'
),
(
  8,
  'Apartamento Familiar en Ciudad Salitre',
  'Ubicación estratégica en el centro geográfico de Bogotá con rápido acceso al aeropuerto y centros empresariales. Conjunto con cancha de squash, sendero peatonal, gimnasio y piscina climatizada.',
  'apartamento', 'arriendo', 'Ciudad Salitre', 'Fontibón', 'Av. La Esperanza # 68B-45',
  2800000, 380000, 3, 2, 85.0,
  true, true, false, true, true, true, true,
  ARRAY['Ingresos 2.5x costo total', 'Cédula vigente', 'Póliza SURA / El Libertador', 'Certificado laboral o renta'],
  NULL, 42.0, 59.0, 4.658400, -74.107200, false, '2026-10-21T10:00:00Z', '2026-10-21T10:00:00Z'
),
(
  9,
  'Apartamento Práctico y Económico en Castilla',
  'Costo accesible con administración económica en conjunto cerrado. 3 habitaciones con clósets modulares, cocina integral con gas natural y pisos cerámicos de fácil mantenimiento.',
  'apartamento', 'arriendo', 'Castilla', 'Kennedy', 'Cl. 8 # 78-20',
  1250000, 130000, 3, 1, 55.0,
  true, false, false, false, false, true, false,
  ARRAY['Ingresos 2x costo total', 'Cédula vigente', 'Codeudor laboral o fianza digital', 'Extractos bancarios 3 meses'],
  NULL, 26.0, 76.0, 4.640800, -74.142200, false, '2026-10-17T10:00:00Z', '2026-10-17T10:00:00Z'
),
(
  10,
  'Apartamento con Vista Panorámica Colina Campestre',
  'Piso 11 con vista abierta hacia la sabana norte y los atardeceres bogotanos. Balcón amplio con punto de gas, cocina integral con isla central, parqueadero cubierto y zonas húmedas.',
  'apartamento', 'arriendo', 'Colina Campestre', 'Suba', 'Cl. 138 # 55-40',
  2600000, 340000, 3, 2, 88.0,
  true, true, true, true, true, true, true,
  ARRAY['Ingresos 2.5x costo total', 'Cédula vigente', 'Seguro de arrendamiento digital', 'Carnet de vacunas si tienes mascota'],
  NULL, 62.0, 14.0, 4.724800, -74.062300, false, '2026-10-22T10:00:00Z', '2026-10-22T10:00:00Z'
),
(
  11,
  'Loft Universitario Colonial en La Candelaria',
  'Loft con vigas de madera a la vista y balcón de baranda republicana sobre calle empedrada. A pocos minutos a pie de las universidades de Los Andes, Externado, Rosario y América.',
  'apartamento', 'arriendo', 'La Candelaria', 'La Candelaria', 'Cl. 11 # 3-45',
  1550000, 120000, 1, 1, 48.0,
  true, false, true, false, false, true, true,
  ARRAY['Ingresos 2.5x costo total o responsable académico', 'Cédula o carnet universitario + codeudor', 'Fianza digital en línea'],
  NULL, 65.0, 79.0, 4.596800, -74.071500, false, '2026-10-23T10:00:00Z', '2026-10-23T10:00:00Z'
),
(
  12,
  'Local Comercial con Vitrina en Polo Club',
  'Local sobre vía arterial con vitrina panorámica de piso a techo. Espacio abierto adaptable para consultorio, estudio de diseño, cafetería o showroom. Dos baños y parqueadero para clientes.',
  'local', 'arriendo', 'Polo Club', 'Barrios Unidos', 'Autopista Norte # 84-15',
  3500000, 250000, 1, 2, 110.0,
  false, true, false, false, false, false, false,
  ARRAY['RUT y Cámara de Comercio', 'Estados financieros o extractos', 'Codeudor con finca raíz o póliza comercial', 'Depósito comercial en garantía'],
  3500000, 60.0, 34.0, 4.671200, -74.060900, false, '2026-10-14T10:00:00Z', '2026-10-14T10:00:00Z'
);

SELECT setval(pg_get_serial_sequence('inmuebles', 'id'), (SELECT MAX(id) FROM inmuebles));

-- Imágenes (3 por inmueble)
INSERT INTO imagenes (inmueble_id, url, orden) VALUES
(1, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80', 1),
(1, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80', 2),
(1, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80', 3),
(2, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80', 1),
(2, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80', 2),
(2, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80', 3),
(3, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80', 1),
(3, 'https://images.unsplash.com/photo-1502005229762-ee1afd346387?auto=format&fit=crop&w=900&q=80', 2),
(3, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80', 3),
(4, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80', 1),
(4, 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=900&q=80', 2),
(4, 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=900&q=80', 3),
(5, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', 1),
(5, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80', 2),
(5, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80', 3),
(6, 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=900&q=80', 1),
(6, 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=900&q=80', 2),
(6, 'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=900&q=80', 3),
(7, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80', 1),
(7, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80', 2),
(7, 'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=900&q=80', 3),
(8, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80', 1),
(8, 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=900&q=80', 2),
(8, 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=900&q=80', 3),
(9, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80', 1),
(9, 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80', 2),
(9, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80', 3),
(10, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80', 1),
(10, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80', 2),
(10, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', 3),
(11, 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=900&q=80', 1),
(11, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80', 2),
(11, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80', 3),
(12, 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80', 1),
(12, 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80', 2),
(12, 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80', 3);

-- Puntos de interés (Mínimo 1 transporte y 1 supermercado por inmueble, más zonas de riesgo selectivas)
INSERT INTO puntos_interes (inmueble_id, categoria, nombre, detalle, distancia_cuadras) VALUES
-- Inmueble 1: Chapinero Alto
(1, 'transporte', 'Estación Cl. 63 (TransMilenio)', 'Troncal Caracas con conexión directa a universidades', 3),
(1, 'supermercado', 'Éxito Calle 63', 'Supermercado de cadena con horario extendido', 2),

-- Inmueble 2: Quinta Camacho
(2, 'transporte', 'Estación Flores (TransMilenio)', 'Acceso rápido por Calle 69 y Av. Caracas', 4),
(2, 'supermercado', 'Carulla Quinta Camacho', 'Abierto hasta las 10:00 PM', 2),

-- Inmueble 3: La Soledad
(3, 'transporte', 'Estación Av. 39 (TransMilenio)', 'Troncal Caracas a minutos de Universidad Nacional y Javeriana', 5),
(3, 'supermercado', 'D1 Park Way', 'Tienda de conveniencia sobre el corredor verde', 1),

-- Inmueble 4: Galerías
(4, 'transporte', 'Estación Campín - UAN (TransMilenio)', 'Rutas troncales NQS y alimentadores', 4),
(4, 'supermercado', 'Éxito Galerías', 'Centro comercial y supermercado', 3),

-- Inmueble 5: Santa Bárbara
(5, 'transporte', 'Estación Pepe Sierra (TransMilenio)', 'Troncal Autopista Norte', 5),
(5, 'supermercado', 'Carulla Unicentro', 'Dentro de C.C. Unicentro', 3),

-- Inmueble 6: Cedritos
(6, 'transporte', 'Paradero SITP Cl. 142 / Estación Alcalá', 'Ruta alimentadora directa a Troncal Norte', 1),
(6, 'supermercado', 'Carulla Cedritos', 'Avenida 19 con Calle 140', 4),

-- Inmueble 7: Modelia
(7, 'transporte', 'Estación Av. Rojas (TransMilenio)', 'Troncal Calle 26 / El Dorado', 6),
(7, 'supermercado', 'Éxito Modelia', 'Sector residencial y comercial', 3),
(7, 'zona_riesgo', 'Cruce Av. Boyacá con Calle 24', 'Baja iluminación peatonal bajo puente vehicular después de las 10:00 PM', 5),

-- Inmueble 8: Ciudad Salitre
(8, 'transporte', 'Estación Salitre El Greco (TransMilenio)', 'Troncal El Dorado con fácil conexión al aeropuerto y centro', 4),
(8, 'supermercado', 'Jumbo Gran Estación', 'Centro Comercial Gran Estación', 5),

-- Inmueble 9: Castilla
(9, 'transporte', 'Estación Banderas (TransMilenio)', 'Portal / Estación de alta frecuencia Troncal Américas', 7),
(9, 'supermercado', 'D1 Castilla', 'Supermercado barrial a media cuadra del parque', 2),
(9, 'zona_riesgo', 'Paso Peatonal Av. Boyacá Nocturno', 'Se recomienda precaución y usar rutas iluminadas pasadas las 10:00 PM', 4),

-- Inmueble 10: Colina Campestre
(10, 'transporte', 'Paradero SITP Cl. 138 / Estación 21 Ángeles', 'Conexión a Suba y Autopista Norte', 2),
(10, 'supermercado', 'Éxito Colina', 'Parque La Colina / Av. Boyacá', 3),

-- Inmueble 11: La Candelaria
(11, 'transporte', 'Estación Las Aguas (TransMilenio)', 'Troncal Eje Ambiental a pasos de Los Andes y Rosario', 3),
(11, 'supermercado', 'Olímpica Centro', 'Sobre Carrera 7ma', 2),
(11, 'zona_riesgo', 'Sendero hacia cerros después de 9:00 PM', 'Sector histórico con poco flujo peatonal nocturno en calles altas hacia los cerros', 2),

-- Inmueble 12: Polo Club
(12, 'transporte', 'Estación Polo (TransMilenio)', 'Troncal Calle 80 / Autopista Norte', 2),
(12, 'supermercado', 'Carulla Polo', 'Corredor comercial de Barrios Unidos', 3);
