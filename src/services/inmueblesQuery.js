/**
 * HABITABOGOTÁ — /src/services/inmueblesQuery.js
 * Consultas SQL parametrizadas compartidas para inmuebles, imágenes y puntos de interés.
 */

import { isDatabaseConfigured, query } from '../db.js';
import { memoryStore } from './memoryStore.js';

// Normaliza una fila de PostgreSQL al formato consumido por la API y el frontend
export function formatInmuebleRow(row) {
  const imagenes = Array.isArray(row.imagenes)
    ? row.imagenes.filter(Boolean)
    : [];

  const pois = Array.isArray(row.puntos_interes)
    ? row.puntos_interes.filter(Boolean)
    : [];

  const transportePoi = pois.find((p) => p.categoria === 'transporte') || null;
  const superPoi = pois.find((p) => p.categoria === 'supermercado') || null;
  const riesgoPoi = pois.find((p) => p.categoria === 'zona_riesgo') || null;

  const precio = Number(row.precio);
  const administracion = Number(row.administracion || 0);
  const costoTotal = row.costo_total !== undefined
    ? Number(row.costo_total)
    : (row.operacion === 'arriendo' ? precio + administracion : precio);

  return {
    id: Number(row.id),
    titulo: row.titulo,
    descripcion: row.descripcion,
    tipo: row.tipo,
    operacion: row.operacion,
    barrio: row.barrio,
    localidad: row.localidad,
    direccion: row.direccion_aprox,
    direccion_aprox: row.direccion_aprox,
    precio,
    precioBase: precio,
    administracion,
    costo_total: costoTotal,
    habitaciones: Number(row.habitaciones),
    banos: Number(row.banos),
    area_m2: Number(row.area_m2),
    m2: Number(row.area_m2),
    caracteristicas: {
      mascotas: Boolean(row.mascotas),
      parqueadero: Boolean(row.parqueadero),
      balcon: Boolean(row.balcon),
      gimnasio: Boolean(row.gimnasio),
      piscina: Boolean(row.piscina),
      porteria: Boolean(row.porteria)
    },
    mascotas: Boolean(row.mascotas),
    parqueadero: Boolean(row.parqueadero),
    balcon: Boolean(row.balcon),
    gimnasio: Boolean(row.gimnasio),
    piscina: Boolean(row.piscina),
    porteria: Boolean(row.porteria),
    tour_3d: Boolean(row.tour_3d),
    tour3D: Boolean(row.tour_3d),
    requisitos: Array.isArray(row.requisitos) ? row.requisitos : [],
    deposito: row.deposito !== null && row.deposito !== undefined ? Number(row.deposito) : null,
    coords: {
      x: Number(row.pos_x),
      y: Number(row.pos_y)
    },
    pos_x: Number(row.pos_x),
    pos_y: Number(row.pos_y),
    lat: row.lat !== null && row.lat !== undefined ? Number(row.lat) : null,
    lng: row.lng !== null && row.lng !== undefined ? Number(row.lng) : null,
    destacado: Boolean(row.destacado),
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
    imagenes,
    puntos_interes: pois,
    transporte: transportePoi
      ? {
          estacion: transportePoi.nombre,
          detalle: transportePoi.detalle || '',
          distanciaCuadras: Number(transportePoi.distancia_cuadras)
        }
      : { estacion: 'Transporte cercano', detalle: '', distanciaCuadras: 5 },
    supermercado: superPoi
      ? {
          nombre: superPoi.nombre,
          detalle: superPoi.detalle || '',
          distanciaCuadras: Number(superPoi.distancia_cuadras)
        }
      : { nombre: 'Comercio barrial', detalle: '', distanciaCuadras: 3 },
    zonaRiesgo: riesgoPoi
      ? {
          existe: true,
          nombre: riesgoPoi.nombre,
          detalle: riesgoPoi.detalle || riesgoPoi.nombre,
          distanciaCuadras: Number(riesgoPoi.distancia_cuadras)
        }
      : {
          existe: false,
          nombre: null,
          detalle: 'Sector residencial sin alertas de riesgo cercanas reportadas.',
          distanciaCuadras: null
        }
  };
}

const BASE_SELECT_SQL = `
  SELECT
    i.*,
    COALESCE(
      (
        SELECT json_agg(img.url ORDER BY img.orden ASC, img.id ASC)
        FROM imagenes img
        WHERE img.inmueble_id = i.id
      ),
      '[]'::json
    ) AS imagenes,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', p.id,
            'categoria', p.categoria,
            'nombre', p.nombre,
            'detalle', p.detalle,
            'distancia_cuadras', p.distancia_cuadras
          )
          ORDER BY p.categoria ASC, p.distancia_cuadras ASC
        )
        FROM puntos_interes p
        WHERE p.inmueble_id = i.id
      ),
      '[]'::json
    ) AS puntos_interes
  FROM inmuebles i
`;

function searchInmueblesMemory(filters = {}) {
  let list = [...memoryStore.getAllInmuebles()];

  if (filters.q) {
    const term = String(filters.q).toLowerCase();
    list = list.filter((item) =>
      [item.titulo, item.barrio, item.localidad, item.direccion_aprox, item.descripcion]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }

  if (filters.tipo && filters.tipo !== 'todos') {
    list = list.filter((item) => item.tipo === filters.tipo);
  }

  if (filters.operacion && filters.operacion !== 'todos') {
    list = list.filter((item) => item.operacion === filters.operacion);
  }

  if (filters.precio_min !== undefined && filters.precio_min !== null) {
    list = list.filter((item) => item.costo_total >= Number(filters.precio_min));
  }

  if (filters.precio_max !== undefined && filters.precio_max !== null) {
    list = list.filter((item) => item.costo_total <= Number(filters.precio_max));
  }

  if (filters.habitaciones !== undefined && filters.habitaciones !== null && Number(filters.habitaciones) > 0) {
    list = list.filter((item) => item.habitaciones >= Number(filters.habitaciones));
  }

  const boolFields = ['mascotas', 'parqueadero', 'balcon', 'gimnasio', 'piscina', 'porteria', 'tour_3d'];
  for (const field of boolFields) {
    if (filters[field] === true) {
      list = list.filter((item) => Boolean(item[field]) === true);
    }
  }

  if (filters.max_cuadras_transporte !== undefined && filters.max_cuadras_transporte !== null) {
    const maxCuadras = Number(filters.max_cuadras_transporte);
    list = list.filter((item) =>
      (item.puntos_interes || []).some(
        (pt) => pt.categoria === 'transporte' && Number(pt.distancia_cuadras) <= maxCuadras
      )
    );
  }

  list.sort((a, b) => {
    if (filters.orden === 'costo_asc') {
      return a.costo_total - b.costo_total || a.id - b.id;
    }
    if (filters.orden === 'costo_desc') {
      return b.costo_total - a.costo_total || a.id - b.id;
    }
    if (filters.orden === 'recientes') {
      return new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime() || b.id - a.id;
    }
    if (filters.orden === 'area_desc') {
      return b.area_m2 - a.area_m2 || a.id - b.id;
    }
    return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0) || a.costo_total - b.costo_total || a.id - b.id;
  });

  const limite = Math.min(Math.max(Number(filters.limite) || 24, 1), 50);
  const pagina = Math.max(Number(filters.pagina) || 1, 1);
  const offset = (pagina - 1) * limite;
  const total = list.length;
  const slice = list.slice(offset, offset + limite);

  return {
    inmuebles: slice.map(formatInmuebleRow),
    total,
    pagina,
    limite
  };
}

// Consulta paginada con filtros parametrizados
export async function searchInmuebles(filters = {}) {
  if (!isDatabaseConfigured()) {
    return searchInmueblesMemory(filters);
  }

  const conditions = [];
  const params = [];

  const pushParam = (val) => {
    params.push(val);
    return `$${params.length}`;
  };

  if (filters.q) {
    const p = pushParam(`%${filters.q}%`);
    conditions.push(`(
      i.titulo ILIKE ${p}
      OR i.barrio ILIKE ${p}
      OR i.localidad ILIKE ${p}
      OR i.direccion_aprox ILIKE ${p}
      OR i.descripcion ILIKE ${p}
    )`);
  }

  if (filters.tipo && filters.tipo !== 'todos') {
    const p = pushParam(filters.tipo);
    conditions.push(`i.tipo = ${p}`);
  }

  if (filters.operacion && filters.operacion !== 'todos') {
    const p = pushParam(filters.operacion);
    conditions.push(`i.operacion = ${p}`);
  }

  if (filters.precio_min !== undefined && filters.precio_min !== null) {
    const p = pushParam(filters.precio_min);
    conditions.push(`i.costo_total >= ${p}`);
  }

  if (filters.precio_max !== undefined && filters.precio_max !== null) {
    const p = pushParam(filters.precio_max);
    conditions.push(`i.costo_total <= ${p}`);
  }

  if (filters.habitaciones !== undefined && filters.habitaciones !== null && filters.habitaciones > 0) {
    const p = pushParam(filters.habitaciones);
    conditions.push(`i.habitaciones >= ${p}`);
  }

  const boolFields = ['mascotas', 'parqueadero', 'balcon', 'gimnasio', 'piscina', 'porteria', 'tour_3d'];
  for (const field of boolFields) {
    if (filters[field] === true) {
      conditions.push(`i.${field} = TRUE`);
    }
  }

  if (filters.max_cuadras_transporte !== undefined && filters.max_cuadras_transporte !== null) {
    const p = pushParam(filters.max_cuadras_transporte);
    conditions.push(`EXISTS (
      SELECT 1 FROM puntos_interes pt
      WHERE pt.inmueble_id = i.id
        AND pt.categoria = 'transporte'
        AND pt.distancia_cuadras <= ${p}
    )`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderByClause = 'ORDER BY i.destacado DESC, i.costo_total ASC, i.id ASC';
  if (filters.orden === 'costo_asc') {
    orderByClause = 'ORDER BY i.costo_total ASC, i.id ASC';
  } else if (filters.orden === 'costo_desc') {
    orderByClause = 'ORDER BY i.costo_total DESC, i.id ASC';
  } else if (filters.orden === 'recientes') {
    orderByClause = 'ORDER BY i.creado_en DESC, i.id DESC';
  } else if (filters.orden === 'area_desc') {
    orderByClause = 'ORDER BY i.area_m2 DESC, i.id ASC';
  }

  const limite = Math.min(Math.max(Number(filters.limite) || 24, 1), 50);
  const pagina = Math.max(Number(filters.pagina) || 1, 1);
  const offset = (pagina - 1) * limite;

  const countSql = `SELECT COUNT(*)::int AS total FROM inmuebles i ${whereClause}`;
  const countResult = await query(countSql, params);
  const total = countResult.rows[0]?.total || 0;

  const limitParam = pushParam(limite);
  const offsetParam = pushParam(offset);

  const dataSql = `
    ${BASE_SELECT_SQL}
    ${whereClause}
    ${orderByClause}
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  const dataResult = await query(dataSql, params);

  return {
    inmuebles: dataResult.rows.map(formatInmuebleRow),
    total,
    pagina,
    limite
  };
}

export async function getInmuebleById(id) {
  if (!isDatabaseConfigured()) {
    const row = memoryStore.getInmuebleById(id);
    return row ? formatInmuebleRow(row) : null;
  }
  const sql = `${BASE_SELECT_SQL} WHERE i.id = $1 LIMIT 1`;
  const res = await query(sql, [id]);
  if (!res.rows.length) return null;
  return formatInmuebleRow(res.rows[0]);
}

export async function getInmueblesByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  if (!isDatabaseConfigured()) {
    return memoryStore.getInmueblesByIds(ids).map(formatInmuebleRow);
  }
  const sql = `${BASE_SELECT_SQL} WHERE i.id = ANY($1::int[]) ORDER BY array_position($1::int[], i.id)`;
  const res = await query(sql, [ids]);
  return res.rows.map(formatInmuebleRow);
}

export async function getBarriosResumen() {
  if (!isDatabaseConfigured()) {
    return memoryStore.getBarriosResumen();
  }
  const sql = `
    SELECT
      MIN(id) AS id,
      barrio,
      localidad,
      COUNT(*)::int AS cantidad
    FROM inmuebles
    GROUP BY barrio, localidad
    ORDER BY MIN(id) ASC
  `;
  const res = await query(sql);
  return res.rows;
}
