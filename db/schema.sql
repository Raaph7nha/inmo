-- ============================================================================
-- HABITABOGOTÁ — Esquema Relacional PostgreSQL (Neon) con Usuarios, Viviendas, Guardados, Comparador y Visitas
-- ============================================================================

DROP VIEW IF EXISTS vista_viviendas_resumen;
DROP TABLE IF EXISTS visitas CASCADE;
DROP TABLE IF EXISTS chat_mensajes CASCADE;
DROP TABLE IF EXISTS mensajes_soporte CASCADE;
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS comparador CASCADE;
DROP TABLE IF EXISTS guardados CASCADE;
DROP TABLE IF EXISTS puntos_interes CASCADE;
DROP TABLE IF EXISTS imagenes_vivienda CASCADE;
DROP TABLE IF EXISTS imagenes_huerfanas CASCADE;
DROP TABLE IF EXISTS viviendas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 1. Usuarios con JWT y roles
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(255) UNIQUE NOT NULL,
  contrasena_hash TEXT NOT NULL,
  rol VARCHAR(20) DEFAULT 'comprador' CHECK (rol IN ('comprador', 'arrendador', 'admin')),
  avatar_url TEXT,
  verificado BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- 2. Viviendas (tabla central, reemplaza inmuebles)
CREATE TABLE viviendas (
  id SERIAL PRIMARY KEY,
  propietario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(20) CHECK (tipo IN ('casa', 'apartamento', 'local', 'otro')),
  operacion VARCHAR(20) CHECK (operacion IN ('arriendo', 'venta')),
  barrio VARCHAR(100),
  localidad VARCHAR(100),
  ciudad VARCHAR(80) DEFAULT 'Bogotá',
  direccion_aprox VARCHAR(200),
  precio NUMERIC(14,2) NOT NULL CHECK (precio >= 0),
  administracion NUMERIC(14,2) DEFAULT 0 CHECK (administracion >= 0),
  costo_total NUMERIC(14,2) GENERATED ALWAYS AS (
    CASE WHEN operacion = 'arriendo' THEN precio + administracion ELSE precio END
  ) STORED,
  deposito NUMERIC(14,2) CHECK (deposito IS NULL OR deposito >= 0),
  habitaciones INT CHECK (habitaciones >= 0),
  banos INT CHECK (banos >= 0),
  area_m2 NUMERIC(8,2) CHECK (area_m2 > 0),
  mascotas BOOLEAN DEFAULT FALSE,
  parqueadero BOOLEAN DEFAULT FALSE,
  balcon BOOLEAN DEFAULT FALSE,
  gimnasio BOOLEAN DEFAULT FALSE,
  piscina BOOLEAN DEFAULT FALSE,
  porteria BOOLEAN DEFAULT FALSE,
  tour_3d BOOLEAN DEFAULT FALSE,
  requisitos TEXT[],
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  pos_x NUMERIC(5,2),
  pos_y NUMERIC(5,2),
  destacado BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- 3. Imágenes de vivienda con Cloudinary
CREATE TABLE imagenes_vivienda (
  id SERIAL PRIMARY KEY,
  vivienda_id INT REFERENCES viviendas(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT NOT NULL,
  url TEXT NOT NULL,
  url_thumb TEXT,
  orden INT DEFAULT 0
);

-- 4. Imágenes huérfanas
CREATE TABLE imagenes_huerfanas (
  id SERIAL PRIMARY KEY,
  cloudinary_public_id TEXT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- 5. Puntos de interés cercanos
CREATE TABLE puntos_interes (
  id SERIAL PRIMARY KEY,
  vivienda_id INT REFERENCES viviendas(id) ON DELETE CASCADE,
  categoria VARCHAR(30) CHECK (categoria IN ('transporte', 'supermercado', 'zona_riesgo', 'colegio', 'hospital', 'parque')),
  nombre VARCHAR(120),
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  distancia_cuadras INT CHECK (distancia_cuadras >= 0)
);

-- 6. Guardados (Soporta usuario autenticado o sesión anónima)
CREATE TABLE guardados (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  sesion_id VARCHAR(100),
  vivienda_id INT REFERENCES viviendas(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- 7. Comparador (máximo 3 por usuario o sesión anónima)
CREATE TABLE comparador (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  sesion_id VARCHAR(100),
  vivienda_id INT REFERENCES viviendas(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- 8. Visitas agendadas (requiere login)
CREATE TABLE visitas (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  vivienda_id INT REFERENCES viviendas(id) ON DELETE CASCADE,
  fecha_preferida DATE NOT NULL,
  horario VARCHAR(20) CHECK (horario IN ('mañana', 'tarde', 'noche')) NOT NULL,
  telefono VARCHAR(50) NOT NULL,
  mensaje TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada')),
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- 9. Alertas de búsqueda por correo
CREATE TABLE alertas (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  correo VARCHAR(255) NOT NULL,
  filtros JSONB DEFAULT '{}'::jsonb,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- 10. Mensajes de soporte
CREATE TABLE mensajes_soporte (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- 11. Historial de chat
CREATE TABLE chat_mensajes (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  rol VARCHAR(20) CHECK (rol IN ('user', 'assistant')),
  contenido TEXT NOT NULL,
  viviendas_ids INT[] DEFAULT '{}',
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- VISTA DE RESUMEN
CREATE OR REPLACE VIEW vista_viviendas_resumen AS
SELECT
  v.*,
  CASE WHEN v.operacion = 'arriendo' THEN (v.precio + v.administracion) ELSE v.precio END AS costo_mensual_real
FROM viviendas v;

-- ÍNDICES
CREATE INDEX idx_viviendas_operacion ON viviendas (operacion);
CREATE INDEX idx_guardados_usuario ON guardados (usuario_id);
CREATE INDEX idx_guardados_sesion ON guardados (sesion_id);
CREATE INDEX idx_comparador_usuario ON comparador (usuario_id);
CREATE INDEX idx_comparador_sesion ON comparador (sesion_id);
CREATE INDEX idx_visitas_usuario ON visitas (usuario_id);
