/**
 * HABITABOGOTÁ — /js/data.js
 * Catálogo realista de 12 inmuebles en Bogotá D.C. y lista de barrios clave.
 */

const BARRIOS_BOGOTA = [
  { id: "chapinero", nombre: "Chapinero Alto", subtitulo: "Universitario & Cafés", coords: { x: 73, y: 40 } },
  { id: "teusaquillo", nombre: "La Soledad", subtitulo: "Park Way & Cultura", coords: { x: 58, y: 56 } },
  { id: "usaquen", nombre: "Santa Bárbara", subtitulo: "Residencial & Verde", coords: { x: 77, y: 22 } },
  { id: "cedritos", nombre: "Cedritos", subtitulo: "Comercial & Parques", coords: { x: 79, y: 15 } },
  { id: "salitre", nombre: "Ciudad Salitre", subtitulo: "Central & Conectado", coords: { x: 42, y: 59 } },
  { id: "suba", nombre: "Colina Campestre", subtitulo: "Familiar & Sabana", coords: { x: 62, y: 14 } },
  { id: "candelaria", nombre: "La Candelaria", subtitulo: "Centro Histórico", coords: { x: 65, y: 79 } },
  { id: "kennedy", nombre: "Castilla", subtitulo: "Accesible & Activo", coords: { x: 26, y: 76 } }
];

const INMUEBLES_BOGOTA = [
  {
    id: "inm-1",
    titulo: "Apartamento Iluminado con Balcón y Vista a Cerros",
    tipo: "apartamento",
    operacion: "arriendo",
    barrio: "Chapinero Alto",
    direccion: "Cl. 63 # 4-82",
    precioBase: 2400000,
    administracion: 350000,
    habitaciones: 2,
    banos: 2,
    m2: 68,
    caracteristicas: {
      mascotas: true,
      parqueadero: true,
      balcon: true,
      gimnasio: true,
      piscina: false,
      porteria: true
    },
    tour3D: true,
    destacado: true, // "Selección de la semana" que rompe la cuadrícula en escritorio
    coords: { x: 73, y: 40 },
    transporte: { estacion: "Estación Cl. 63 (TransMilenio)", tipo: "TransMilenio", distanciaCuadras: 3 },
    supermercado: { nombre: "Éxito Calle 63", distanciaCuadras: 2 },
    zonaRiesgo: { existe: false, detalle: "Sector residencial y universitario de alto tránsito peatonal seguro." },
    imagenes: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Apartamento con vista franca hacia la cordillera oriental andina. Pisos en madera laminada de alto tráfico, cocina integral abierta con mesón en granito y barra de desayuno. Ubicación inmejorable cerca a universidades Javeriana y Piloto.",
    fechaPublicacion: "2026-10-18"
  },
  {
    id: "inm-2",
    titulo: "Apartamento Clásico Remodelado en Quinta Camacho",
    tipo: "apartamento",
    operacion: "arriendo",
    barrio: "Quinta Camacho",
    direccion: "Cra. 10A # 69-35",
    precioBase: 3100000,
    administracion: 420000,
    habitaciones: 3,
    banos: 2,
    m2: 92,
    caracteristicas: {
      mascotas: true,
      parqueadero: true,
      balcon: true,
      gimnasio: false,
      piscina: false,
      porteria: true
    },
    tour3D: true,
    destacado: false,
    coords: { x: 71, y: 36 },
    transporte: { estacion: "Estación Flores (TransMilenio)", tipo: "TransMilenio", distanciaCuadras: 4 },
    supermercado: { nombre: "Carulla Quinta Camacho", distanciaCuadras: 2 },
    zonaRiesgo: { existe: false, detalle: "Barrio gastronómico de arquitectura inglesa y vigilancia diurna/nocturna." },
    imagenes: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Espacios generosos y techos altos en el barrio patrimonial de Quinta Camacho. Chimenea de leña tradicional en ladrillo a la vista, estudio independiente con biblioteca de nogal y zona de lavandería aireada.",
    fechaPublicacion: "2026-10-20"
  },
  {
    id: "inm-3",
    titulo: "Apartamento Art Déco frente al Park Way",
    tipo: "apartamento",
    operacion: "arriendo",
    barrio: "La Soledad (Teusaquillo)",
    direccion: "Cra. 21 # 39B-12",
    precioBase: 1850000,
    administracion: 180000,
    habitaciones: 2,
    banos: 1,
    m2: 60,
    caracteristicas: {
      mascotas: true,
      parqueadero: false,
      balcon: false,
      gimnasio: false,
      piscina: false,
      porteria: true
    },
    tour3D: false,
    destacado: false,
    coords: { x: 58, y: 56 },
    transporte: { estacion: "Estación Av. 39 (TransMilenio)", tipo: "TransMilenio", distanciaCuadras: 5 },
    supermercado: { nombre: "D1 Park Way", distanciaCuadras: 1 },
    zonaRiesgo: { existe: false, detalle: "Corredor cultural y gastronómico seguro con permanente afluencia de vecinos y ciclistas." },
    imagenes: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1502005229762-ee1afd346387?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Para quienes aman la vida de barrio y la cultura. Edificio emblemático estilo Art Déco conservado. Ventanales originales con aislamiento acústico térmico, a un paso de librerías, cafés de especialidad y teatros.",
    fechaPublicacion: "2026-10-21"
  },
  {
    id: "inm-4",
    titulo: "Casa Señorial de Dos Plantas en Galerías",
    tipo: "casa",
    operacion: "arriendo",
    barrio: "Galerías (Teusaquillo)",
    direccion: "Cl. 53A # 25-18",
    precioBase: 4200000,
    administracion: 0,
    habitaciones: 4,
    banos: 3,
    m2: 180,
    caracteristicas: {
      mascotas: true,
      parqueadero: true,
      balcon: true,
      gimnasio: false,
      piscina: false,
      porteria: false
    },
    tour3D: false,
    destacado: false,
    coords: { x: 55, y: 48 },
    transporte: { estacion: "SITP Cra 24 y TransMilenio Campín", tipo: "TransMilenio", distanciaCuadras: 4 },
    supermercado: { nombre: "Éxito Galerías", distanciaCuadras: 3 },
    zonaRiesgo: { existe: false, detalle: "Sector mixto residencial y comercial con iluminación vial óptima." },
    imagenes: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Casa independiente sin cuota de administración. Jardín interior privado, garaje para dos vehículos, amplias estancias familiares y cocina tradicional con despensa. Ideal para vivienda de familia grande o estudio creativo.",
    fechaPublicacion: "2026-10-15"
  },
  {
    id: "inm-5",
    titulo: "Apartamento Club House Santa Bárbara",
    tipo: "apartamento",
    operacion: "venta",
    barrio: "Santa Bárbara (Usaquén)",
    direccion: "Cra. 12 # 118-40",
    precioBase: 620000000,
    administracion: 550000,
    habitaciones: 3,
    banos: 3,
    m2: 115,
    caracteristicas: {
      mascotas: true,
      parqueadero: true,
      balcon: true,
      gimnasio: true,
      piscina: true,
      porteria: true
    },
    tour3D: true,
    destacado: false,
    coords: { x: 77, y: 22 },
    transporte: { estacion: "Estación Pepe Sierra (TransMilenio)", tipo: "TransMilenio", distanciaCuadras: 5 },
    supermercado: { nombre: "C.C. Unicentro", distanciaCuadras: 3 },
    zonaRiesgo: { existe: false, detalle: "Barrio residencial estrato 5-6 con circuito cerrado y patrullaje motorizado." },
    imagenes: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Conjunto cerrado de alta categoría con piscina cubierta y climatizada, sauna, turco, gimnasio dotado, salón social y parque infantil privado. Acabados importados y dos parqueaderos independientes.",
    fechaPublicacion: "2026-10-19"
  },
  {
    id: "inm-6",
    titulo: "Apartamento Iluminado con Terraza en Cedritos",
    tipo: "apartamento",
    operacion: "arriendo",
    barrio: "Cedritos (Usaquén)",
    direccion: "Cl. 142 # 16-55",
    precioBase: 2100000,
    administracion: 290000,
    habitaciones: 2,
    banos: 2,
    m2: 72,
    caracteristicas: {
      mascotas: false,
      parqueadero: true,
      balcon: true,
      gimnasio: true,
      piscina: false,
      porteria: true
    },
    tour3D: true,
    destacado: false,
    coords: { x: 79, y: 15 },
    transporte: { estacion: "Paradero SITP Cl. 142", tipo: "SITP", distanciaCuadras: 1 },
    supermercado: { nombre: "Carulla Cedritos", distanciaCuadras: 4 },
    zonaRiesgo: { existe: false, detalle: "Sector plano con ciclorrutas conectadas, parques arbolados y comercios." },
    imagenes: [
      "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Apartamento exterior orientado al poniente con excelente captación térmica. Terraza privada para plantas y descanso, cocina tipo americano y habitación principal con baño en suite y vestier.",
    fechaPublicacion: "2026-10-22"
  },
  {
    id: "inm-7",
    titulo: "Casa Familiar Residencial en Modelia",
    tipo: "casa",
    operacion: "venta",
    barrio: "Modelia (Fontibón)",
    direccion: "Cra. 75 # 24C-30",
    precioBase: 480000000,
    administracion: 90000,
    habitaciones: 3,
    banos: 2,
    m2: 140,
    caracteristicas: {
      mascotas: true,
      parqueadero: true,
      balcon: true,
      gimnasio: false,
      piscina: false,
      porteria: false
    },
    tour3D: false,
    destacado: false,
    coords: { x: 34, y: 57 },
    transporte: { estacion: "Estación Av. Rojas (TransMilenio)", tipo: "TransMilenio", distanciaCuadras: 6 },
    supermercado: { nombre: "Éxito Modelia", distanciaCuadras: 3 },
    zonaRiesgo: { existe: false, detalle: "Barrio tranquilo de calles anchas con acceso rápido a Av. Esperanza y Av. El Dorado." },
    imagenes: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Propiedad de dos pisos con antejardín cercado. Primer nivel con sala, comedor, estudio, cocina amplia y patio de ropas semicubierto. Segundo nivel con 3 alcobas y baño de habitaciones.",
    fechaPublicacion: "2026-10-12"
  },
  {
    id: "inm-8",
    titulo: "Apartamento Familiar en Ciudad Salitre",
    tipo: "apartamento",
    operacion: "arriendo",
    barrio: "Ciudad Salitre (Fontibón)",
    direccion: "Av. La Esperanza # 68B-45",
    precioBase: 2800000,
    administracion: 380000,
    habitaciones: 3,
    banos: 2,
    m2: 85,
    caracteristicas: {
      mascotas: true,
      parqueadero: true,
      balcon: false,
      gimnasio: true,
      piscina: true,
      porteria: true
    },
    tour3D: true,
    destacado: false,
    coords: { x: 42, y: 59 },
    transporte: { estacion: "Estación Salitre El Greco (TransMilenio)", tipo: "TransMilenio", distanciaCuadras: 4 },
    supermercado: { nombre: "C.C. Gran Estación", distanciaCuadras: 5 },
    zonaRiesgo: { existe: false, detalle: "Conjunto residencial con control biométrico y amplias zonas verdes protegidas." },
    imagenes: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Ubicación privilegiada en el centro geográfico de Bogotá. Rápido acceso al aeropuerto, centro y norte. Conjunto con cancha de squash, zonas de BBQ, sendero peatonal y piscina para adultos y niños.",
    fechaPublicacion: "2026-10-21"
  },
  {
    id: "inm-9",
    titulo: "Apartamento Práctico y Económico en Castilla",
    tipo: "apartamento",
    operacion: "arriendo",
    barrio: "Castilla (Kennedy)",
    direccion: "Cl. 8 # 78-20",
    precioBase: 1250000,
    administracion: 130000,
    habitaciones: 3,
    banos: 1,
    m2: 55,
    caracteristicas: {
      mascotas: true,
      parqueadero: false,
      balcon: false,
      gimnasio: false,
      piscina: false,
      porteria: true
    },
    tour3D: false,
    destacado: false,
    coords: { x: 26, y: 76 },
    transporte: { estacion: "Estación Banderas (TransMilenio)", tipo: "TransMilenio", distanciaCuadras: 7 },
    supermercado: { nombre: "D1 Castilla", distanciaCuadras: 2 },
    zonaRiesgo: { existe: true, detalle: "Se recomienda precaución en el cruce de Av. Boyacá pasadas las 10:00 PM." },
    imagenes: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Costo accesible con administración económica en conjunto cerrado. 3 habitaciones con armarios modulares, cocina integral con gas natural y pisos en gres cerámico de fácil limpieza.",
    fechaPublicacion: "2026-10-17"
  },
  {
    id: "inm-10",
    titulo: "Apartamento con Vista Panorámica Colina Campestre",
    tipo: "apartamento",
    operacion: "arriendo",
    barrio: "Colina Campestre (Suba)",
    direccion: "Cl. 138 # 55-40",
    precioBase: 2600000,
    administracion: 340000,
    habitaciones: 3,
    banos: 2,
    m2: 88,
    caracteristicas: {
      mascotas: true,
      parqueadero: true,
      balcon: true,
      gimnasio: true,
      piscina: true,
      porteria: true
    },
    tour3D: true,
    destacado: false,
    coords: { x: 62, y: 14 },
    transporte: { estacion: "SITP Calle 138 / Estación 21 Ángeles", tipo: "SITP", distanciaCuadras: 2 },
    supermercado: { nombre: "Éxito Colina", distanciaCuadras: 3 },
    zonaRiesgo: { existe: false, detalle: "Barrio consolidado con excelentes parques caninos y senderos de trote." },
    imagenes: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Piso 11 con vista abierta hacia la sabana norte y los atardeceres. Balcón con espacio para parrilla a gas, cocina integral con isla central, dos estacionamientos cubiertos y club house.",
    fechaPublicacion: "2026-10-22"
  },
  {
    id: "inm-11",
    titulo: "Loft Universitario Colonial en La Candelaria",
    tipo: "apartamento",
    operacion: "arriendo",
    barrio: "La Candelaria (Centro)",
    direccion: "Cl. 11 # 3-45",
    precioBase: 1600000,
    administracion: 120000,
    habitaciones: 1,
    banos: 1,
    m2: 48,
    caracteristicas: {
      mascotas: false,
      parqueadero: false,
      balcon: true,
      gimnasio: false,
      piscina: false,
      porteria: true
    },
    tour3D: true,
    destacado: false,
    coords: { x: 65, y: 79 },
    transporte: { estacion: "Estación Las Aguas (TransMilenio)", tipo: "TransMilenio", distanciaCuadras: 3 },
    supermercado: { nombre: "Olímpica Centro", distanciaCuadras: 2 },
    zonaRiesgo: { existe: true, detalle: "Sector histórico de valor patrimonial; evitar tránsito solitario hacia los cerros después de las 9:00 PM." },
    imagenes: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Loft con vigas de madera a la vista y balcón de baranda republicana sobre calle empedrada. A minutos a pie de las universidades de Los Andes, Externado, Rosario y América.",
    fechaPublicacion: "2026-10-23"
  },
  {
    id: "inm-12",
    titulo: "Local Comercial con Vitrina en Polo Club",
    tipo: "local",
    operacion: "arriendo",
    barrio: "Polo Club (Barrios Unidos)",
    direccion: "Autopista Norte # 84-15",
    precioBase: 3500000,
    administracion: 250000,
    habitaciones: 1,
    banos: 2,
    m2: 110,
    caracteristicas: {
      mascotas: false,
      parqueadero: true,
      balcon: false,
      gimnasio: false,
      piscina: false,
      porteria: false
    },
    tour3D: false,
    destacado: false,
    coords: { x: 60, y: 34 },
    transporte: { estacion: "Estación Polo (TransMilenio)", tipo: "TransMilenio", distanciaCuadras: 2 },
    supermercado: { nombre: "Carulla Polo", distanciaCuadras: 3 },
    zonaRiesgo: { existe: false, detalle: "Corredor comercial de alto tráfico peatonal y vehicular frente a la troncal de TransMilenio." },
    imagenes: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80"
    ],
    descripcion: "Local sobre vía arterial con vitrina panorámica de piso a techo. Espacio abierto adaptable para consultorio, estudio de diseño, cafetería o showroom. Dos baños independientes y parqueadero para clientes.",
    fechaPublicacion: "2026-10-14"
  }
];
