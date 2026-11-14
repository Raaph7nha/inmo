/**
 * HABITABOGOTÁ — /src/services/viviendasQuery.js
 * Consultas SQL parametrizadas para viviendas, imágenes y puntos de interés.
 */

import { isDatabaseConfigured, query } from '../db.js';
import { memoryStore } from './memoryStore.js';

export function formatViviendaRow(row) {
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
    propietario_id: row.propietario_id ? Number(row.propietario_id) : null,
    titulo: row.titulo,
    descripcion: row.descripcion,
    tipo: row.tipo,
    operacion: row.operacion,
    barrio: row.barrio,
    localidad: row.localidad,
    ciudad: row.ciudad || 'Bogotá',
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
      x: Number(row.pos_x || 50),
      y: Number(row.pos_y || 50)
    },
    pos_x: Number(row.pos_x || 50),
    pos_y: Number(row.pos_y || 50),
    lat: row.lat !== null && row.lat !== undefined ? Number(row.lat) : 4.711,
    lng: row.lng !== null && row.lng !== undefined ? Number(row.lng) : -74.0721,
    destacado: Boolean(row.destacado),
    activo: Boolean(row.activo ?? true),
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
      : { estacion: 'Transporte cercano', detalle: '', distanciaCuadras: 3 },
    supermercado: superPoi
      ? {
          nombre: superPoi.nombre,
          detalle: superPoi.detalle || '',
          distanciaCuadras: Number(superPoi.distancia_cuadras)
        }
      : { nombre: 'Comercio barrial', detalle: '', distanciaCuadras: 2 },
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
    v.*,
    COALESCE(
      (
        SELECT json_agg(img.url ORDER BY img.orden ASC, img.id ASC)
        FROM imagenes_vivienda img
        WHERE img.vivienda_id = v.id
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
            'lat', p.lat,
            'lng', p.lng,
            'distancia_cuadras', p.distancia_cuadras
          )
          ORDER BY p.categoria ASC, p.distancia_cuadras ASC
        )
        FROM puntos_interes p
        WHERE p.vivienda_id = v.id
      ),
      '[]'::json
    ) AS puntos_interes
  FROM viviendas v
  WHERE v.activo = TRUE
`;

function searchViviendasMemory(filters = {}) {
  let list = [...memoryStore.getAllViviendas()].filter((v) => v.activo !== false);

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
    viviendas: slice.map(formatViviendaRow),
    total,
    pagina,
    limite
  };
}

export async function searchViviendas(filters = {}) {
  if (!isDatabaseConfigured()) {
    return searchViviendasMemory(filters);
  }

  const conditions = ['v.activo = TRUE'];
  const params = [];

  const pushParam = (val) => {
    params.push(val);
    return `$${params.length}`;
  };

  if (filters.q) {
    const p = pushParam(`%${filters.q}%`);
    conditions.push(`(
      v.titulo ILIKE ${p}
      OR v.barrio ILIKE ${p}
      OR v.localidad ILIKE ${p}
      OR v.direccion_aprox ILIKE ${p}
      OR v.descripcion ILIKE ${p}
    )`);
  }

  if (filters.tipo && filters.tipo !== 'todos') {
    const p = pushParam(filters.tipo);
    conditions.push(`v.tipo = ${p}`);
  }

  if (filters.operacion && filters.operacion !== 'todos') {
    const p = pushParam(filters.operacion);
    conditions.push(`v.operacion = ${p}`);
  }

  if (filters.precio_min !== undefined && filters.precio_min !== null) {
    const p = pushParam(filters.precio_min);
    conditions.push(`v.costo_total >= ${p}`);
  }

  if (filters.precio_max !== undefined && filters.precio_max !== null) {
    const p = pushParam(filters.precio_max);
    conditions.push(`v.costo_total <= ${p}`);
  }

  if (filters.habitaciones !== undefined && filters.habitaciones !== null && filters.habitaciones > 0) {
    const p = pushParam(filters.habitaciones);
    conditions.push(`v.habitaciones >= ${p}`);
  }

  const boolFields = ['mascotas', 'parqueadero', 'balcon', 'gimnasio', 'piscina', 'porteria', 'tour_3d'];
  for (const field of boolFields) {
    if (filters[field] === true) {
      conditions.push(`v.${field} = TRUE`);
    }
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  let orderByClause = 'ORDER BY v.destacado DESC, v.costo_total ASC, v.id ASC';
  if (filters.orden === 'costo_asc') {
    orderByClause = 'ORDER BY v.costo_total ASC, v.id ASC';
  } else if (filters.orden === 'costo_desc') {
    orderByClause = 'ORDER BY v.costo_total DESC, v.id ASC';
  } else if (filters.orden === 'recientes') {
    orderByClause = 'ORDER BY v.creado_en DESC, v.id DESC';
  } else if (filters.orden === 'area_desc') {
    orderByClause = 'ORDER BY v.area_m2 DESC, v.id ASC';
  }

  const limite = Math.min(Math.max(Number(filters.limite) || 24, 1), 50);
  const pagina = Math.max(Number(filters.pagina) || 1, 1);
  const offset = (pagina - 1) * limite;

  const countSql = `SELECT COUNT(*)::int AS total FROM viviendas v ${whereClause}`;
  const countResult = await query(countSql, params);
  const total = countResult.rows[0]?.total || 0;

  const limitParam = pushParam(limite);
  const offsetParam = pushParam(offset);

  const dataSql = `
    SELECT
      v.*,
      COALESCE(
        (
          SELECT json_agg(img.url ORDER BY img.orden ASC, img.id ASC)
          FROM imagenes_vivienda img
          WHERE img.vivienda_id = v.id
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
              'lat', p.lat,
              'lng', p.lng,
              'distancia_cuadras', p.distancia_cuadras
            )
            ORDER BY p.categoria ASC, p.distancia_cuadras ASC
          )
          FROM puntos_interes p
          WHERE p.vivienda_id = v.id
        ),
        '[]'::json
      ) AS puntos_interes
    FROM viviendas v
    ${whereClause}
    ${orderByClause}
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  const dataResult = await query(dataSql, params);

  return {
    viviendas: dataResult.rows.map(formatViviendaRow),
    total,
    pagina,
    limite
  };
}

export async function getViviendaById(id) {
  if (!isDatabaseConfigured()) {
    const row = memoryStore.getViviendaById(id);
    return row ? formatViviendaRow(row) : null;
  }
  const sql = `
    SELECT
      v.*,
      COALESCE(
        (
          SELECT json_agg(img.url ORDER BY img.orden ASC, img.id ASC)
          FROM imagenes_vivienda img
          WHERE img.vivienda_id = v.id
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
              'lat', p.lat,
              'lng', p.lng,
              'distancia_cuadras', p.distancia_cuadras
            )
            ORDER BY p.categoria ASC, p.distancia_cuadras ASC
          )
          FROM puntos_interes p
          WHERE p.vivienda_id = v.id
        ),
        '[]'::json
      ) AS puntos_interes
    FROM viviendas v
    WHERE v.id = $1
    LIMIT 1
  `;
  const res = await query(sql, [id]);
  if (!res.rows.length) return null;
  return formatViviendaRow(res.rows[0]);
}

export async function getViviendasByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  if (!isDatabaseConfigured()) {
    return memoryStore.getViviendasByIds(ids).map(formatViviendaRow);
  }
  const sql = `
    SELECT
      v.*,
      COALESCE(
        (
          SELECT json_agg(img.url ORDER BY img.orden ASC, img.id ASC)
          FROM imagenes_vivienda img
          WHERE img.vivienda_id = v.id
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
              'lat', p.lat,
              'lng', p.lng,
              'distancia_cuadras', p.distancia_cuadras
            )
            ORDER BY p.categoria ASC, p.distancia_cuadras ASC
          )
          FROM puntos_interes p
          WHERE p.vivienda_id = v.id
        ),
        '[]'::json
      ) AS puntos_interes
    FROM viviendas v
    WHERE v.id = ANY($1::int[])
    ORDER BY array_position($1::int[], v.id)
  `;
  const res = await query(sql, [ids]);
  return res.rows.map(formatViviendaRow);
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
    FROM viviendas
    WHERE activo = TRUE
    GROUP BY barrio, localidad
    ORDER BY MIN(id) ASC
  `;
  const res = await query(sql);
  return res.rows;
}
