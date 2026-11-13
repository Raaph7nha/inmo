-- ============================================================================
-- HABITABOGOTÁ — Esquema Relacional PostgreSQL (Neon)
-- Incluye tablas, restricciones CHECK, columna calculada, vista e índices
-- ============================================================================

-- Limpieza opcional en orden inverso para recreación limpia si se requiere
DROP VIEW IF EXISTS vista_inmuebles_resumen;
DROP TABLE IF EXISTS chat_mensajes CASCADE;
DROP TABLE IF EXISTS mensajes_soporte CASCADE;
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS comparador CASCADE;
DROP TABLE IF EXISTS guardados CASCADE;
DROP TABLE IF EXISTS sesiones CASCADE;
DROP TABLE IF EXISTS puntos_interes CASCADE;
DROP TABLE IF EXISTS imagenes CASCADE;
DROP TABLE IF EXISTS inmuebles CASCADE;

-- 1. Catálogo principal de inmuebles en Bogotá
CREATE TABLE inmuebles (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('casa', 'apartamento', 'local')),
  operacion TEXT NOT NULL CHECK (operacion IN ('arriendo', 'venta')),
  barrio TEXT NOT NULL,
  localidad TEXT NOT NULL,
  direccion_aprox TEXT NOT NULL,
  precio NUMERIC(14, 2) NOT NULL CHECK (precio >= 0),
  administracion NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (administracion >= 0),
  -- Columna calculada persistida: en arriendo suma canon + administración
  costo_total NUMERIC(14, 2) GENERATED ALWAYS AS (
    CASE WHEN operacion = 'arriendo' THEN precio + administracion ELSE precio END
  ) STORED,
  habitaciones INT NOT NULL DEFAULT 0 CHECK (habitaciones >= 0),
  banos INT NOT NULL DEFAULT 1 CHECK (banos >= 0),
  area_m2 NUMERIC(10, 2) NOT NULL CHECK (area_m2 > 0),
  mascotas BOOLEAN NOT NULL DEFAULT FALSE,
  parqueadero BOOLEAN NOT NULL DEFAULT FALSE,
  balcon BOOLEAN NOT NULL DEFAULT FALSE,
  gimnasio BOOLEAN NOT NULL DEFAULT FALSE,
  piscina BOOLEAN NOT NULL DEFAULT FALSE,
  porteria BOOLEAN NOT NULL DEFAULT FALSE,
  tour_3d BOOLEAN NOT NULL DEFAULT FALSE,
  requisitos TEXT[] NOT NULL DEFAULT '{}',
  deposito NUMERIC(14, 2) NULL CHECK (deposito IS NULL OR deposito >= 0),
  -- Coordenadas porcentuales del mapa vectorial ilustrado (0-100)
  pos_x NUMERIC(5, 2) NOT NULL CHECK (pos_x >= 0 AND pos_x <= 100),
  pos_y NUMERIC(5, 2) NOT NULL CHECK (pos_y >= 0 AND pos_y <= 100),
  -- Coordenadas geográficas reales en Bogotá
  lat NUMERIC(9, 6),
  lng NUMERIC(9, 6),
  destacado BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vista de apoyo con costo_total explícito y cálculo consolidado
CREATE OR REPLACE VIEW vista_inmuebles_resumen AS
SELECT
  i.*,
  CASE WHEN i.operacion = 'arriendo' THEN (i.precio + i.administracion) ELSE i.precio END AS costo_mensual_real
FROM inmuebles i;

-- 2. Galería de imágenes por inmueble
CREATE TABLE imagenes (
  id SERIAL PRIMARY KEY,
  inmueble_id INT NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0 CHECK (orden >= 0)
);

-- 3. Puntos de interés cercanos (transporte, supermercados y zonas de riesgo)
CREATE TABLE puntos_interes (
  id SERIAL PRIMARY KEY,
  inmueble_id INT NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN ('transporte', 'supermercado', 'zona_riesgo')),
  nombre TEXT NOT NULL,
  detalle TEXT NULL,
  distancia_cuadras INT NOT NULL CHECK (distancia_cuadras >= 0)
);

-- 4. Sesiones anónimas de usuario (UUID generado en el navegador)
CREATE TABLE sesiones (
  id UUID PRIMARY KEY,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Inmuebles guardados (Favoritos por sesión)
CREATE TABLE guardados (
  sesion_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  inmueble_id INT NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sesion_id, inmueble_id)
);

-- 6. Comparador de inmuebles (máximo 3 por sesión validado en API)
CREATE TABLE comparador (
  sesion_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  inmueble_id INT NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sesion_id, inmueble_id)
);

-- 7. Alertas de búsqueda por correo electrónico
CREATE TABLE alertas (
  id SERIAL PRIMARY KEY,
  sesion_id UUID NULL REFERENCES sesiones(id) ON DELETE SET NULL,
  correo TEXT NOT NULL,
  filtros JSONB NOT NULL DEFAULT '{}'::jsonb,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Mensajes del formulario de soporte y asesoría legal
CREATE TABLE mensajes_soporte (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Historial persistente de conversación con el asistente Habi
CREATE TABLE chat_mensajes (
  id SERIAL PRIMARY KEY,
  sesion_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('user', 'assistant')),
  contenido TEXT NOT NULL,
  inmuebles_ids INT[] NOT NULL DEFAULT '{}',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ÍNDICES PARA CONSULTAS Y FILTROS DE ALTO RENDIMIENTO
-- ============================================================================
CREATE INDEX idx_inmuebles_barrio ON inmuebles (barrio);
CREATE INDEX idx_inmuebles_localidad ON inmuebles (localidad);
CREATE INDEX idx_inmuebles_precio ON inmuebles (precio);
CREATE INDEX idx_inmuebles_costo_total ON inmuebles (costo_total);
CREATE INDEX idx_inmuebles_tipo ON inmuebles (tipo);
CREATE INDEX idx_inmuebles_operacion ON inmuebles (operacion);
CREATE INDEX idx_inmuebles_habitaciones ON inmuebles (habitaciones);

-- Índices booleanos de filtros facetados
CREATE INDEX idx_inmuebles_filtros_bool ON inmuebles (
  mascotas, parqueadero, balcon, gimnasio, piscina, porteria, tour_3d
);

-- Índices relacionales y de sesión
CREATE INDEX idx_imagenes_inmueble ON imagenes (inmueble_id, orden);
CREATE INDEX idx_poi_inmueble_cat ON puntos_interes (inmueble_id, categoria);
CREATE INDEX idx_guardados_sesion ON guardados (sesion_id, creado_en DESC);
CREATE INDEX idx_comparador_sesion ON comparador (sesion_id, creado_en ASC);
CREATE INDEX idx_chat_sesion_fecha ON chat_mensajes (sesion_id, creado_en DESC);
