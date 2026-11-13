/**
 * HABITABOGOTÁ — /src/services/chatTools.js
 * Definición de herramientas (function calling) y ejecución segura contra Neon Postgres.
 * La IA nunca genera SQL ni accede directamente a la base de datos.
 */

import { z } from 'zod';
import { searchInmuebles, getInmuebleById, getInmueblesByIds } from './inmueblesQuery.js';

export const CHAT_TOOLS_SCHEMA = [
  {
    type: 'function',
    function: {
      name: 'buscar_inmuebles',
      description: 'Busca inmuebles reales en Bogotá en la base de datos según zona/barrio, operación, presupuesto total, habitaciones, comodidades, cercanía a transporte y ordenamiento. Devuelve máximo 5 candidatos ordenados con un puntaje transparente de idoneidad.',
      parameters: {
        type: 'object',
        properties: {
          zona: { type: 'string', description: 'Barrio, localidad o palabra clave (ej: Chapinero, Teusaquillo, Usaquén, La Candelaria, Salitre, Suba, Castilla, universidad)' },
          barrio: { type: 'string', description: 'Alias opcional para filtrar por barrio o localidad' },
          tipo: { type: 'string', enum: ['apartamento', 'casa', 'local', 'todos'], description: 'Tipo de inmueble' },
          operacion: { type: 'string', enum: ['arriendo', 'venta', 'todos'], description: 'Tipo de negocio: arriendo o venta' },
          precio_max: { type: 'number', description: 'Presupuesto máximo de costo total en COP (incluye administración en arriendo)' },
          precio_min: { type: 'number', description: 'Presupuesto mínimo en COP' },
          habitaciones_min: { type: 'integer', description: 'Número mínimo de habitaciones' },
          mascotas: { type: 'boolean', description: 'True si requiere que acepten mascotas (pet friendly)' },
          parqueadero: { type: 'boolean', description: 'True si requiere parqueadero propio' },
          balcon: { type: 'boolean', description: 'True si requiere balcón o terraza' },
          gimnasio: { type: 'boolean', description: 'True si requiere gimnasio' },
          piscina: { type: 'boolean', description: 'True si requiere piscina' },
          porteria: { type: 'boolean', description: 'True si requiere portería 24/7' },
          tour_3d: { type: 'boolean', description: 'True si requiere recorrido virtual 3D' },
          max_cuadras_transporte: { type: 'integer', description: 'Distancia máxima en cuadras a estación de TransMilenio o paradero SITP' },
          ordenar_por: { type: 'string', enum: ['mejor_puntaje', 'costo_asc', 'costo_desc', 'recientes'], description: 'Criterio de orden' },
          limite: { type: 'integer', description: 'Cantidad máxima de resultados (1 a 5)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'obtener_detalle_inmueble',
      description: 'Obtiene la ficha completa de un inmueble específico por su ID, incluyendo descripción, requisitos legales, depósito, imágenes y puntos de interés cercanos.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID numérico del inmueble' }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'comparar_inmuebles',
      description: 'Compara de 2 a 3 inmuebles reales por sus IDs en cuanto a canon, administración, costo total, área, mascotas, parqueadero, transporte y seguridad.',
      parameters: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: { type: 'integer' },
            description: 'Lista de 2 a 3 IDs numéricos de inmuebles a comparar'
          }
        },
        required: ['ids']
      }
    }
  }
];

const buscarArgsSchema = z.object({
  zona: z.string().max(80).optional(),
  barrio: z.string().max(80).optional(),
  tipo: z.enum(['apartamento', 'casa', 'local', 'todos']).optional(),
  operacion: z.enum(['arriendo', 'venta', 'todos']).optional(),
  precio_max: z.coerce.number().nonnegative().optional(),
  precio_min: z.coerce.number().nonnegative().optional(),
  habitaciones_min: z.coerce.number().int().min(0).max(10).optional(),
  mascotas: z.boolean().optional(),
  parqueadero: z.boolean().optional(),
  balcon: z.boolean().optional(),
  gimnasio: z.boolean().optional(),
  piscina: z.boolean().optional(),
  porteria: z.boolean().optional(),
  tour_3d: z.boolean().optional(),
  max_cuadras_transporte: z.coerce.number().int().min(1).max(30).optional(),
  ordenar_por: z.enum(['mejor_puntaje', 'costo_asc', 'costo_desc', 'recientes']).optional(),
  limite: z.coerce.number().int().min(1).max(5).optional()
});

const detalleArgsSchema = z.object({
  id: z.coerce.number().int().positive()
});

const compararArgsSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(3)
});

// Calcula un puntaje transparente (0 a 100) para elegir el "mejor inmueble"
function scoreCandidate(item, args) {
  let puntaje = 30; // Cumple filtros obligatorios en la consulta
  const motivos = [];

  // 1. Ahorro / ajuste frente al presupuesto
  if (args.precio_max && args.precio_max > 0) {
    const ratio = item.costo_total / args.precio_max;
    if (ratio <= 0.85) {
      puntaje += 25;
      motivos.push('Muy por debajo de tu presupuesto total');
    } else if (ratio <= 1.0) {
      puntaje += 18;
      motivos.push('Dentro de tu presupuesto con administración incluida');
    }
  } else {
    // Eficiencia de costo por m2 si no especificó tope
    puntaje += 15;
  }

  // 2. Cercanía a transporte masivo
  const cuadras = item.transporte?.distanciaCuadras ?? 5;
  if (cuadras <= 2) {
    puntaje += 20;
    motivos.push(`A solo ${cuadras} cuadras de ${item.transporte.estacion}`);
  } else if (cuadras <= 4) {
    puntaje += 15;
    motivos.push(`Buen acceso a ${item.transporte.estacion} (${cuadras} cuadras)`);
  } else if (cuadras <= 6) {
    puntaje += 9;
  } else {
    puntaje += 4;
  }

  // 3. Ausencia de zona de riesgo cercana
  if (!item.zonaRiesgo?.existe) {
    puntaje += 15;
    motivos.push('Sin alertas de zona de riesgo cercanas');
  } else {
    motivos.push(`Precaución cercana: ${item.zonaRiesgo.detalle}`);
  }

  // 4. Tour 3D disponible
  if (item.tour_3d) {
    puntaje += 10;
    motivos.push('Cuenta con Tour Virtual 360°');
  }

  return {
    puntaje: Math.min(100, puntaje),
    motivos
  };
}

function summarizeForTool(item, scoring = null) {
  return {
    id: item.id,
    titulo: item.titulo,
    barrio: item.barrio,
    localidad: item.localidad,
    tipo: item.tipo,
    operacion: item.operacion,
    precio: item.precio,
    administracion: item.administracion,
    costo_total: item.costo_total,
    habitaciones: item.habitaciones,
    banos: item.banos,
    area_m2: item.area_m2,
    caracteristicas: item.caracteristicas,
    tour_3d: item.tour_3d,
    estacion_cercana: item.transporte?.estacion || null,
    cuadras_transporte: item.transporte?.distanciaCuadras ?? null,
    supermercado_cercano: item.supermercado?.nombre || null,
    zona_riesgo_cercana: Boolean(item.zonaRiesgo?.existe),
    zona_riesgo_detalle: item.zonaRiesgo?.existe ? item.zonaRiesgo.detalle : 'Ninguna reportada',
    imagen_principal: item.imagenes?.[0] || null,
    ...(scoring ? { puntaje: scoring.puntaje, motivos_puntaje: scoring.motivos } : {})
  };
}

function buildFrontendFilters(args) {
  const filters = {};
  const q = args.zona || args.barrio;
  if (q) filters.keyword = q;
  if (args.tipo && args.tipo !== 'todos') filters.tipo = args.tipo;
  if (args.operacion) filters.operacion = args.operacion;
  if (args.precio_min !== undefined) filters.precioMin = args.precio_min;
  if (args.precio_max !== undefined) filters.precioMax = args.precio_max;
  if (args.habitaciones_min !== undefined) filters.habitacionesMin = args.habitaciones_min;
  if (args.mascotas) filters.mascotas = true;
  if (args.parqueadero) filters.parqueadero = true;
  if (args.balcon) filters.balcon = true;
  if (args.gimnasio) filters.gimnasio = true;
  if (args.piscina) filters.piscina = true;
  if (args.porteria) filters.porteria = true;
  if (args.tour_3d) filters.tour3D = true;
  return filters;
}

export async function executeChatTool(toolName, rawArgs) {
  if (toolName === 'buscar_inmuebles') {
    const parsed = buscarArgsSchema.safeParse(rawArgs || {});
    if (!parsed.success) {
      return {
        ok: false,
        error: 'Parámetros de búsqueda inválidos.',
        inmuebles_resumidos: [],
        inmuebles_completos: [],
        filtros_sugeridos: {}
      };
    }

    const args = parsed.data;
    const keyword = (args.zona || args.barrio || '').trim() || undefined;
    // Mapeo semántico amigable para búsquedas como "universidad"
    let qMapped = keyword;
    if (keyword && /universidad/i.test(keyword)) {
      qMapped = undefined; // Dejamos traer candidatos urbanos cercanos a zonas universitarias si dijo solo "universidad"
    }

    const ordenMap = {
      costo_asc: 'costo_asc',
      costo_desc: 'costo_desc',
      recientes: 'recientes',
      mejor_puntaje: 'costo_asc'
    };

    const dbResult = await searchInmuebles({
      q: qMapped,
      tipo: args.tipo,
      operacion: args.operacion,
      precio_min: args.precio_min,
      precio_max: args.precio_max,
      habitaciones: args.habitaciones_min,
      mascotas: args.mascotas,
      parqueadero: args.parqueadero,
      balcon: args.balcon,
      gimnasio: args.gimnasio,
      piscina: args.piscina,
      porteria: args.porteria,
      tour_3d: args.tour_3d,
      max_cuadras_transporte: args.max_cuadras_transporte,
      orden: ordenMap[args.ordenar_por || 'mejor_puntaje'],
      limite: 12
    });

    let candidatos = dbResult.inmuebles;

    // Si buscó específicamente "universidad", priorizar zonas universitarias (Chapinero, Teusaquillo, La Candelaria)
    if (keyword && /universidad/i.test(keyword)) {
      const uniLocs = ['chapinero', 'teusaquillo', 'la candelaria'];
      const uniFiltered = candidatos.filter((c) =>
        uniLocs.includes(c.localidad.toLowerCase()) || /universidad/i.test(c.descripcion)
      );
      if (uniFiltered.length > 0) {
        candidatos = uniFiltered;
      }
    }

    const scored = candidatos.map((item) => {
      const scoring = scoreCandidate(item, args);
      return { item, scoring };
    });

    if (!args.ordenar_por || args.ordenar_por === 'mejor_puntaje') {
      scored.sort((a, b) => b.scoring.puntaje - a.scoring.puntaje || a.item.costo_total - b.item.costo_total);
    }

    const maxLimit = Math.min(args.limite || 5, 5);
    const top = scored.slice(0, maxLimit);

    return {
      ok: true,
      total_encontrados: candidatos.length,
      inmuebles_resumidos: top.map(({ item, scoring }) => summarizeForTool(item, scoring)),
      inmuebles_completos: top.map(({ item }) => item),
      filtros_sugeridos: buildFrontendFilters(args)
    };
  }

  if (toolName === 'obtener_detalle_inmueble') {
    const parsed = detalleArgsSchema.safeParse(rawArgs || {});
    if (!parsed.success) {
      return { ok: false, error: 'ID de inmueble inválido.' };
    }
    const item = await getInmuebleById(parsed.data.id);
    if (!item) {
      return { ok: false, error: `No existe un inmueble con ID ${parsed.data.id}.` };
    }
    return {
      ok: true,
      inmueble: {
        ...summarizeForTool(item),
        descripcion: item.descripcion,
        direccion_aprox: item.direccion_aprox,
        requisitos: item.requisitos,
        deposito: item.deposito,
        puntos_interes: item.puntos_interes
      },
      inmuebles_completos: [item]
    };
  }

  if (toolName === 'comparar_inmuebles') {
    const parsed = compararArgsSchema.safeParse(rawArgs || {});
    if (!parsed.success) {
      return { ok: false, error: 'Debes indicar entre 1 y 3 IDs válidos para comparar.' };
    }
    const items = await getInmueblesByIds(parsed.data.ids);
    if (!items.length) {
      return { ok: false, error: 'No se encontraron los inmuebles solicitados.' };
    }
    const minCost = Math.min(...items.map((x) => x.costo_total));
    return {
      ok: true,
      mejor_costo_id: items.find((x) => x.costo_total === minCost)?.id || null,
      comparacion: items.map((x) => summarizeForTool(x)),
      inmuebles_completos: items
    };
  }

  return { ok: false, error: 'Herramienta desconocida.' };
}
