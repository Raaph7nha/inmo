/**
 * HABITABOGOTÁ — /src/services/memoryStore.js
 * Almacenamiento en memoria de respaldo (solo activo cuando DATABASE_URL no está configurada).
 * Replica exactamente los 12 inmuebles de db/seed.sql y las tablas de sesión/interacción.
 */

import { AppError } from '../middleware/errorHandler.js';

const SEED_INMUEBLES = [
  {
    id: 1,
    titulo: 'Apartamento Iluminado con Balcón y Vista a Cerros',
    descripcion: 'Apartamento con vista franca hacia la cordillera oriental andina. Pisos en madera laminada de alto tráfico, cocina integral abierta con mesón en granito y barra de desayuno. Ubicación ideal cerca a las universidades Javeriana y Piloto.',
    tipo: 'apartamento',
    operacion: 'arriendo',
    barrio: 'Chapinero Alto',
    localidad: 'Chapinero',
    direccion_aprox: 'Cl. 63 # 4-82',
    precio: 2400000,
    administracion: 350000,
    habitaciones: 2,
    banos: 2,
    area_m2: 68,
    mascotas: true,
    parqueadero: true,
    balcon: true,
    gimnasio: true,
    piscina: false,
    porteria: true,
    tour_3d: true,
    requisitos: ['Ingresos 2.5x costo total', 'Cédula vigente', '1 codeudor o fianza digital', 'Póliza estudio aseguradora 5% + IVA'],
    deposito: null,
    pos_x: 73,
    pos_y: 40,
    lat: 4.6486,
    lng: -74.0588,
    destacado: true,
    creado_en: '2026-10-18T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 1, categoria: 'transporte', nombre: 'Estación Cl. 63 (TransMilenio)', detalle: 'Troncal Caracas con conexión directa a universidades', distancia_cuadras: 3 },
      { id: 2, categoria: 'supermercado', nombre: 'Éxito Calle 63', detalle: 'Supermercado de cadena con horario extendido', distancia_cuadras: 2 }
    ]
  },
  {
    id: 2,
    titulo: 'Apartamento Clásico Remodelado en Quinta Camacho',
    descripcion: 'Espacios generosos y techos altos en el barrio patrimonial de Quinta Camacho. Chimenea tradicional en ladrillo a la vista, estudio independiente en nogal y zona de lavandería aireada.',
    tipo: 'apartamento',
    operacion: 'arriendo',
    barrio: 'Quinta Camacho',
    localidad: 'Chapinero',
    direccion_aprox: 'Cra. 10A # 69-35',
    precio: 3100000,
    administracion: 420000,
    habitaciones: 3,
    banos: 2,
    area_m2: 92,
    mascotas: true,
    parqueadero: true,
    balcon: true,
    gimnasio: false,
    piscina: false,
    porteria: true,
    tour_3d: true,
    requisitos: ['Ingresos 3x costo total', 'Cédula vigente', 'Codeudor con solvencia laboral', 'Seguro de arrendamiento'],
    deposito: null,
    pos_x: 71,
    pos_y: 36,
    lat: 4.6542,
    lng: -74.0595,
    destacado: false,
    creado_en: '2026-10-20T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 3, categoria: 'transporte', nombre: 'Estación Flores (TransMilenio)', detalle: 'Acceso rápido por Calle 69 y Av. Caracas', distancia_cuadras: 4 },
      { id: 4, categoria: 'supermercado', nombre: 'Carulla Quinta Camacho', detalle: 'Abierto hasta las 10:00 PM', distancia_cuadras: 2 }
    ]
  },
  {
    id: 3,
    titulo: 'Apartamento Art Déco frente al Park Way',
    descripcion: 'Para quienes disfrutan la vida de barrio y la cultura. Edificio emblemático estilo Art Déco conservado con ventanales acústicos, a pocos pasos de librerías, cafés de especialidad y teatros.',
    tipo: 'apartamento',
    operacion: 'arriendo',
    barrio: 'La Soledad',
    localidad: 'Teusaquillo',
    direccion_aprox: 'Cra. 21 # 39B-12',
    precio: 1850000,
    administracion: 180000,
    habitaciones: 2,
    banos: 1,
    area_m2: 60,
    mascotas: true,
    parqueadero: false,
    balcon: false,
    gimnasio: false,
    piscina: false,
    porteria: true,
    tour_3d: false,
    requisitos: ['Ingresos 2.5x costo total', 'Cédula o pasaporte', 'Póliza digital sin finca raíz', 'Certificado laboral o extractos'],
    deposito: null,
    pos_x: 58,
    pos_y: 56,
    lat: 4.6288,
    lng: -74.0725,
    destacado: false,
    creado_en: '2026-10-21T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1502005229762-ee1afd346387?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 5, categoria: 'transporte', nombre: 'Estación Av. 39 (TransMilenio)', detalle: 'Troncal Caracas a minutos de Universidad Nacional y Javeriana', distancia_cuadras: 5 },
      { id: 6, categoria: 'supermercado', nombre: 'D1 Park Way', detalle: 'Tienda de conveniencia sobre el corredor verde', distancia_cuadras: 1 }
    ]
  },
  {
    id: 4,
    titulo: 'Casa Señorial de Dos Plantas en Galerías',
    descripcion: 'Casa independiente sin cuota de administración. Jardín interior privado, garaje para dos vehículos, amplias estancias familiares y cocina tradicional con despensa. Ideal para familia o estudio creativo.',
    tipo: 'casa',
    operacion: 'arriendo',
    barrio: 'Galerías',
    localidad: 'Teusaquillo',
    direccion_aprox: 'Cl. 53A # 25-18',
    precio: 4200000,
    administracion: 0,
    habitaciones: 4,
    banos: 3,
    area_m2: 180,
    mascotas: true,
    parqueadero: true,
    balcon: true,
    gimnasio: false,
    piscina: false,
    porteria: false,
    tour_3d: false,
    requisitos: ['Ingresos 3x canon', 'Codeudor con finca raíz o póliza', 'Extractos últimos 3 meses', 'Contrato mínimo 12 meses'],
    deposito: null,
    pos_x: 55,
    pos_y: 48,
    lat: 4.6423,
    lng: -74.0751,
    destacado: false,
    creado_en: '2026-10-15T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 7, categoria: 'transporte', nombre: 'Estación Campín - UAN (TransMilenio)', detalle: 'Rutas troncales NQS y alimentadores', distancia_cuadras: 4 },
      { id: 8, categoria: 'supermercado', nombre: 'Éxito Galerías', detalle: 'Centro comercial y supermercado', distancia_cuadras: 3 }
    ]
  },
  {
    id: 5,
    titulo: 'Apartamento Club House Santa Bárbara',
    descripcion: 'Conjunto cerrado de alta categoría con piscina cubierta climatizada, sauna, turco, gimnasio dotado, salón social y parque infantil privado. Acabados importados y dos parqueaderos independientes.',
    tipo: 'apartamento',
    operacion: 'venta',
    barrio: 'Santa Bárbara',
    localidad: 'Usaquén',
    direccion_aprox: 'Cra. 12 # 118-40',
    precio: 620000000,
    administracion: 550000,
    habitaciones: 3,
    banos: 3,
    area_m2: 115,
    mascotas: true,
    parqueadero: true,
    balcon: true,
    gimnasio: true,
    piscina: true,
    porteria: true,
    tour_3d: true,
    requisitos: ['Promesa de compraventa', 'Certificado de tradición y libertad', 'Preaprobado hipotecario o recursos propios', 'Paz y salvo de administración'],
    deposito: null,
    pos_x: 77,
    pos_y: 22,
    lat: 4.6989,
    lng: -74.0412,
    destacado: false,
    creado_en: '2026-10-19T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 9, categoria: 'transporte', nombre: 'Estación Pepe Sierra (TransMilenio)', detalle: 'Troncal Autopista Norte', distancia_cuadras: 5 },
      { id: 10, categoria: 'supermercado', nombre: 'Carulla Unicentro', detalle: 'Dentro de C.C. Unicentro', distancia_cuadras: 3 }
    ]
  },
  {
    id: 6,
    titulo: 'Apartamento Iluminado con Terraza en Cedritos',
    descripcion: 'Apartamento exterior orientado al poniente con excelente iluminación natural. Terraza privada para plantas y descanso, cocina tipo americano y habitación principal con baño en suite y vestier.',
    tipo: 'apartamento',
    operacion: 'arriendo',
    barrio: 'Cedritos',
    localidad: 'Usaquén',
    direccion_aprox: 'Cl. 142 # 16-55',
    precio: 1750000,
    administracion: 240000,
    habitaciones: 2,
    banos: 2,
    area_m2: 72,
    mascotas: false,
    parqueadero: true,
    balcon: true,
    gimnasio: true,
    piscina: false,
    porteria: true,
    tour_3d: true,
    requisitos: ['Ingresos 2.5x costo total', 'Cédula vigente', '1 codeudor o fianza digital', 'No se permiten mascotas en este contrato'],
    deposito: null,
    pos_x: 79,
    pos_y: 15,
    lat: 4.7215,
    lng: -74.0398,
    destacado: false,
    creado_en: '2026-10-22T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 11, categoria: 'transporte', nombre: 'Paradero SITP Cl. 142 / Estación Alcalá', detalle: 'Ruta alimentadora directa a Troncal Norte', distancia_cuadras: 1 },
      { id: 12, categoria: 'supermercado', nombre: 'Carulla Cedritos', detalle: 'Avenida 19 con Calle 140', distancia_cuadras: 4 }
    ]
  },
  {
    id: 7,
    titulo: 'Casa Familiar Residencial en Modelia',
    descripcion: 'Propiedad de dos pisos con antejardín cercado. Primer nivel con sala, comedor, estudio, cocina amplia y patio de ropas semicubierto. Segundo nivel con 3 alcobas y excelente acceso a Av. El Dorado.',
    tipo: 'casa',
    operacion: 'venta',
    barrio: 'Modelia',
    localidad: 'Fontibón',
    direccion_aprox: 'Cra. 75 # 24C-30',
    precio: 480000000,
    administracion: 90000,
    habitaciones: 3,
    banos: 2,
    area_m2: 140,
    mascotas: true,
    parqueadero: true,
    balcon: true,
    gimnasio: false,
    piscina: false,
    porteria: false,
    tour_3d: false,
    requisitos: ['Escritura pública y tradición al día', 'Estudio de títulos', 'Crédito hipotecario o leasing habitacional'],
    deposito: null,
    pos_x: 34,
    pos_y: 57,
    lat: 4.6662,
    lng: -74.1204,
    destacado: false,
    creado_en: '2026-10-12T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 13, categoria: 'transporte', nombre: 'Estación Av. Rojas (TransMilenio)', detalle: 'Troncal Calle 26 / El Dorado', distancia_cuadras: 6 },
      { id: 14, categoria: 'supermercado', nombre: 'Éxito Modelia', detalle: 'Sector residencial y comercial', distancia_cuadras: 3 },
      { id: 15, categoria: 'zona_riesgo', nombre: 'Cruce Av. Boyacá con Calle 24', detalle: 'Baja iluminación peatonal bajo puente vehicular después de las 10:00 PM', distancia_cuadras: 5 }
    ]
  },
  {
    id: 8,
    titulo: 'Apartamento Familiar en Ciudad Salitre',
    descripcion: 'Ubicación estratégica en el centro geográfico de Bogotá con rápido acceso al aeropuerto y centros empresariales. Conjunto con cancha de squash, sendero peatonal, gimnasio y piscina climatizada.',
    tipo: 'apartamento',
    operacion: 'arriendo',
    barrio: 'Ciudad Salitre',
    localidad: 'Fontibón',
    direccion_aprox: 'Av. La Esperanza # 68B-45',
    precio: 2800000,
    administracion: 380000,
    habitaciones: 3,
    banos: 2,
    area_m2: 85,
    mascotas: true,
    parqueadero: true,
    balcon: false,
    gimnasio: true,
    piscina: true,
    porteria: true,
    tour_3d: true,
    requisitos: ['Ingresos 2.5x costo total', 'Cédula vigente', 'Póliza SURA / El Libertador', 'Certificado laboral o renta'],
    deposito: null,
    pos_x: 42,
    pos_y: 59,
    lat: 4.6584,
    lng: -74.1072,
    destacado: false,
    creado_en: '2026-10-21T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 16, categoria: 'transporte', nombre: 'Estación Salitre El Greco (TransMilenio)', detalle: 'Troncal El Dorado con fácil conexión al aeropuerto y centro', distancia_cuadras: 4 },
      { id: 17, categoria: 'supermercado', nombre: 'Jumbo Gran Estación', detalle: 'Centro Comercial Gran Estación', distancia_cuadras: 5 }
    ]
  },
  {
    id: 9,
    titulo: 'Apartamento Práctico y Económico en Castilla',
    descripcion: 'Costo accesible con administración económica en conjunto cerrado. 3 habitaciones con clósets modulares, cocina integral con gas natural y pisos cerámicos de fácil mantenimiento.',
    tipo: 'apartamento',
    operacion: 'arriendo',
    barrio: 'Castilla',
    localidad: 'Kennedy',
    direccion_aprox: 'Cl. 8 # 78-20',
    precio: 1250000,
    administracion: 130000,
    habitaciones: 3,
    banos: 1,
    area_m2: 55,
    mascotas: true,
    parqueadero: false,
    balcon: false,
    gimnasio: false,
    piscina: false,
    porteria: true,
    tour_3d: false,
    requisitos: ['Ingresos 2x costo total', 'Cédula vigente', 'Codeudor laboral o fianza digital', 'Extractos bancarios 3 meses'],
    deposito: null,
    pos_x: 26,
    pos_y: 76,
    lat: 4.6408,
    lng: -74.1422,
    destacado: false,
    creado_en: '2026-10-17T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 18, categoria: 'transporte', nombre: 'Estación Banderas (TransMilenio)', detalle: 'Portal / Estación de alta frecuencia Troncal Américas', distancia_cuadras: 7 },
      { id: 19, categoria: 'supermercado', nombre: 'D1 Castilla', detalle: 'Supermercado barrial a media cuadra del parque', distancia_cuadras: 2 },
      { id: 20, categoria: 'zona_riesgo', nombre: 'Paso Peatonal Av. Boyacá Nocturno', detalle: 'Se recomienda precaución y usar rutas iluminadas pasadas las 10:00 PM', distancia_cuadras: 4 }
    ]
  },
  {
    id: 10,
    titulo: 'Apartamento con Vista Panorámica Colina Campestre',
    descripcion: 'Piso 11 con vista abierta hacia la sabana norte y los atardeceres bogotanos. Balcón amplio con punto de gas, cocina integral con isla central, parqueadero cubierto y zonas húmedas.',
    tipo: 'apartamento',
    operacion: 'arriendo',
    barrio: 'Colina Campestre',
    localidad: 'Suba',
    direccion_aprox: 'Cl. 138 # 55-40',
    precio: 2600000,
    administracion: 340000,
    habitaciones: 3,
    banos: 2,
    area_m2: 88,
    mascotas: true,
    parqueadero: true,
    balcon: true,
    gimnasio: true,
    piscina: true,
    porteria: true,
    tour_3d: true,
    requisitos: ['Ingresos 2.5x costo total', 'Cédula vigente', 'Seguro de arrendamiento digital', 'Carnet de vacunas si tienes mascota'],
    deposito: null,
    pos_x: 62,
    pos_y: 14,
    lat: 4.7248,
    lng: -74.0623,
    destacado: false,
    creado_en: '2026-10-22T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 21, categoria: 'transporte', nombre: 'Paradero SITP Cl. 138 / Estación 21 Ángeles', detalle: 'Conexión a Suba y Autopista Norte', distancia_cuadras: 2 },
      { id: 22, categoria: 'supermercado', nombre: 'Éxito Colina', detalle: 'Parque La Colina / Av. Boyacá', distancia_cuadras: 3 }
    ]
  },
  {
    id: 11,
    titulo: 'Loft Universitario Colonial en La Candelaria',
    descripcion: 'Loft con vigas de madera a la vista y balcón de baranda republicana sobre calle empedrada. A pocos minutos a pie de las universidades de Los Andes, Externado, Rosario y América.',
    tipo: 'apartamento',
    operacion: 'arriendo',
    barrio: 'La Candelaria',
    localidad: 'La Candelaria',
    direccion_aprox: 'Cl. 11 # 3-45',
    precio: 1550000,
    administracion: 120000,
    habitaciones: 1,
    banos: 1,
    area_m2: 48,
    mascotas: true,
    parqueadero: false,
    balcon: true,
    gimnasio: false,
    piscina: false,
    porteria: true,
    tour_3d: true,
    requisitos: ['Ingresos 2.5x costo total o responsable académico', 'Cédula o carnet universitario + codeudor', 'Fianza digital en línea'],
    deposito: null,
    pos_x: 65,
    pos_y: 79,
    lat: 4.5968,
    lng: -74.0715,
    destacado: false,
    creado_en: '2026-10-23T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 23, categoria: 'transporte', nombre: 'Estación Las Aguas (TransMilenio)', detalle: 'Troncal Eje Ambiental a pasos de Los Andes y Rosario', distancia_cuadras: 3 },
      { id: 24, categoria: 'supermercado', nombre: 'Olímpica Centro', detalle: 'Sobre Carrera 7ma', distancia_cuadras: 2 },
      { id: 25, categoria: 'zona_riesgo', nombre: 'Sendero hacia cerros después de 9:00 PM', detalle: 'Sector histórico con poco flujo peatonal nocturno en calles altas hacia los cerros', distancia_cuadras: 2 }
    ]
  },
  {
    id: 12,
    titulo: 'Local Comercial con Vitrina en Polo Club',
    descripcion: 'Local sobre vía arterial con vitrina panorámica de piso a techo. Espacio abierto adaptable para consultorio, estudio de diseño, cafetería o showroom. Dos baños y parqueadero para clientes.',
    tipo: 'local',
    operacion: 'arriendo',
    barrio: 'Polo Club',
    localidad: 'Barrios Unidos',
    direccion_aprox: 'Autopista Norte # 84-15',
    precio: 3500000,
    administracion: 250000,
    habitaciones: 1,
    banos: 2,
    area_m2: 110,
    mascotas: false,
    parqueadero: true,
    balcon: false,
    gimnasio: false,
    piscina: false,
    porteria: false,
    tour_3d: false,
    requisitos: ['RUT y Cámara de Comercio', 'Estados financieros o extractos', 'Codeudor con finca raíz o póliza comercial', 'Depósito comercial en garantía'],
    deposito: 3500000,
    pos_x: 60,
    pos_y: 34,
    lat: 4.6712,
    lng: -74.0609,
    destacado: false,
    creado_en: '2026-10-14T10:00:00Z',
    imagenes: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80'
    ],
    puntos_interes: [
      { id: 26, categoria: 'transporte', nombre: 'Estación Polo (TransMilenio)', detalle: 'Troncal Calle 80 / Autopista Norte', distancia_cuadras: 2 },
      { id: 27, categoria: 'supermercado', nombre: 'Carulla Polo', detalle: 'Corredor comercial de Barrios Unidos', distancia_cuadras: 3 }
    ]
  }
].map((row) => ({
  ...row,
  costo_total: row.operacion === 'arriendo' ? row.precio + row.administracion : row.precio
}));

const sesiones = new Map();
const guardados = new Map(); // sesionId -> number[]
const comparador = new Map(); // sesionId -> number[]
const alertas = [];
const mensajesSoporte = [];
const chatMensajes = [];

export const memoryStore = {
  ensureSession(sesionId) {
    if (!sesiones.has(sesionId)) {
      sesiones.set(sesionId, new Date().toISOString());
    }
  },

  getAllInmuebles() {
    return SEED_INMUEBLES;
  },

  getInmuebleById(id) {
    return SEED_INMUEBLES.find((x) => x.id === Number(id)) || null;
  },

  getInmueblesByIds(ids) {
    return ids.map((id) => SEED_INMUEBLES.find((x) => x.id === Number(id))).filter(Boolean);
  },

  getBarriosResumen() {
    const map = new Map();
    for (const item of SEED_INMUEBLES) {
      const key = `${item.barrio}|${item.localidad}`;
      if (!map.has(key)) {
        map.set(key, { id: item.id, barrio: item.barrio, localidad: item.localidad, cantidad: 0 });
      }
      map.get(key).cantidad += 1;
    }
    return Array.from(map.values());
  },

  getGuardadosIds(sesionId) {
    return [...(guardados.get(sesionId) || [])];
  },

  addGuardado(sesionId, inmuebleId) {
    this.ensureSession(sesionId);
    const list = guardados.get(sesionId) || [];
    if (!list.includes(inmuebleId)) {
      list.unshift(inmuebleId);
      guardados.set(sesionId, list);
    }
    return [...list];
  },

  removeGuardado(sesionId, inmuebleId) {
    const list = (guardados.get(sesionId) || []).filter((id) => id !== Number(inmuebleId));
    guardados.set(sesionId, list);
    return [...list];
  },

  getComparadorIds(sesionId) {
    return [...(comparador.get(sesionId) || [])];
  },

  addComparador(sesionId, inmuebleId) {
    this.ensureSession(sesionId);
    const list = comparador.get(sesionId) || [];
    if (list.includes(inmuebleId)) {
      return { status: 200, ids: [...list] };
    }
    if (list.length >= 3) {
      throw new AppError(
        'Solo puedes comparar hasta 3 inmuebles simultáneos para conservar una tabla legible.',
        400,
        'COMPARE_LIMIT_REACHED'
      );
    }
    list.push(inmuebleId);
    comparador.set(sesionId, list);
    return { status: 201, ids: [...list] };
  },

  removeComparador(sesionId, inmuebleId) {
    const list = (comparador.get(sesionId) || []).filter((id) => id !== Number(inmuebleId));
    comparador.set(sesionId, list);
    return [...list];
  },

  clearComparador(sesionId) {
    comparador.set(sesionId, []);
    return [];
  },

  addAlerta(sesionId, correo, filtros) {
    const record = {
      id: alertas.length + 1,
      sesion_id: sesionId || null,
      correo,
      filtros,
      creado_en: new Date().toISOString()
    };
    alertas.push(record);
    return record;
  },

  addSoporte(nombre, correo, mensaje) {
    const record = {
      id: mensajesSoporte.length + 1,
      nombre,
      correo,
      mensaje,
      creado_en: new Date().toISOString()
    };
    mensajesSoporte.push(record);
    return record;
  },

  addChatMensaje(sesionId, rol, contenido, inmueblesIds = []) {
    this.ensureSession(sesionId);
    const record = {
      id: chatMensajes.length + 1,
      sesion_id: sesionId,
      rol,
      contenido,
      inmuebles_ids: inmueblesIds,
      creado_en: new Date().toISOString()
    };
    chatMensajes.push(record);
    return record;
  }
};
