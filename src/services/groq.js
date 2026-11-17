/**
 * HABITABOGOTÁ — /src/services/groq.js
 * Sistema de modelos Groq con llamarGroqConFallback robusto (mensajesParam).
 */

import Groq from 'groq-sdk';
import { CHAT_TOOLS_SCHEMA, executeChatTool } from './chatTools.js';

export const HABI_SYSTEM_PROMPT = `Eres Habi, el asistente de la plataforma inmobiliaria HabitaBogotá. Hablas en español colombiano, cercano y claro. Ayudas a encontrar el mejor inmueble según zona, presupuesto y necesidades (mascotas, parqueadero, balcón, zonas comunes, cercanía a transporte masivo y seguridad). Reglas: (1) Usa SIEMPRE las herramientas para buscar; nunca inventes inmuebles, precios ni datos. (2) Si falta información esencial (zona, presupuesto, arriendo o compra), pregunta máximo una o dos cosas antes de buscar. (3) Cuando presentes viviendas siempre muestra mínimo 3 opciones con sus costos detallados: arriendo, administración y total. Nunca presentes una sola opción. (4) Los precios en nuestra plataforma son mensuales para arriendo (entre $600.000 y $8.000.000 COP típicamente) y totales para venta (entre $150.000.000 y $2.000.000.000 COP). Si el usuario dice 'hasta 90 millones' para arriendo, es un presupuesto irreal para arriendo mensual, pregúntale si quiere compra o si quiso decir $900.000 mensuales. Si dice 'hasta 2 millones mensuales' para arriendo, busca con precio_max: 2000000. (5) Si no hay resultados, sugiere relajar un filtro concreto y ofrece una alternativa real. (6) Recomienda confirmar requisitos y disponibilidad con el asesor. (7) Solo atiendes temas de la plataforma inmobiliaria; si preguntan otra cosa, redirige amablemente. (8) Respuestas cortas, máximo 120 palabras salvo que pidan una comparación.`;

export const MODELOS = {
  chat: [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b', 
    'openai/gpt-oss-20b',
    'allam-2-7b'
  ],
  descripcion: [
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b'
  ],
  costos: [
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'allam-2-7b'
  ]
};

export const modelosActivos = {
  chat: null,
  descripcion: null,
  costos: null
};

const MAX_TOOL_ITERATIONS = 3;

/**
 * Función reutilizable para llamar a Groq con fallback automático entre modelos de la categoría.
 */
export async function llamarGroqConFallback(tipo, mensajesParam, toolsParam = null) {
  if (!mensajesParam || !Array.isArray(mensajesParam) || mensajesParam.length === 0) {
    throw new Error('mensajes inválidos o vacíos');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY no está configurada en el entorno del servidor.');
  }

  const groq = new Groq({ apiKey });
  const listaModelos = MODELOS[tipo] || MODELOS.chat;

  const modelosAProbar = [];
  if (modelosActivos[tipo] && listaModelos.includes(modelosActivos[tipo])) {
    modelosAProbar.push(modelosActivos[tipo]);
  }
  for (const m of listaModelos) {
    if (!modelosAProbar.includes(m)) {
      modelosAProbar.push(m);
    }
  }

  let ultimoError = null;

  for (const modelo of modelosAProbar) {
    try {
      console.log(`[Groq] Intentando tarea '${tipo}' con modelo: ${modelo}`);
      
      const options = {
        model: modelo,
        messages: mensajesParam,
        temperature: 0.3,
        max_tokens: 700
      };

      if (toolsParam) {
        options.tools = toolsParam;
        options.tool_choice = 'auto';
      }

      const completion = await groq.chat.completions.create(options);
      
      modelosActivos[tipo] = modelo;
      console.log(`[Groq] Éxito con modelo ${modelo} para tarea '${tipo}'`);
      return completion;

    } catch (error) {
      ultimoError = error;
      const status = error?.status || error?.statusCode || 0;
      console.warn(`[Groq] Falló modelo ${modelo} (status ${status}): ${error.message}`);

      if (toolsParam && (status === 400 || status === 404 || status === 429 || error.message.includes('tool'))) {
        try {
          console.log(`[Groq] Reintentando modelo ${modelo} sin herramientas (fallback)...`);
          const fallbackOpts = {
            model: modelo,
            messages: mensajesParam,
            temperature: 0.3,
            max_tokens: 700
          };
          const completion = await groq.chat.completions.create(fallbackOpts);
          modelosActivos[tipo] = modelo;
          return completion;
        } catch (fbErr) {
          console.warn(`[Groq] Fallback sin herramientas con ${modelo} también falló: ${fbErr.message}`);
        }
      }
    }
  }

  console.error('[Groq] Todos los modelos fallaron para la tarea:', tipo, ultimoError);
  throw new Error(ultimoError?.message || 'No pudimos conectar con el asistente de Groq en este momento.');
}

export async function generarDescripcionVivienda(datosVivienda) {
  const mensajesParam = [
    {
      role: 'user',
      content: `Genera una descripción comercial atractiva y profesional en español para una propiedad en el barrio ${datosVivienda.barrio}, Bogotá, tipo ${datosVivienda.tipo}, con canon de ${datosVivienda.precio} y administración de ${datosVivienda.administracion}. Destaca sus ventajas.`
    }
  ];
  const res = await llamarGroqConFallback('descripcion', mensajesParam);
  return res?.choices?.[0]?.message?.content || '';
}

export async function verificarCostos(datosCostos) {
  const mensajesParam = [
    {
      role: 'user',
      content: `Verifica y formatea el desglose de costos para un inmueble en ${datosCostos.barrio}: arriendo ${datosCostos.precio}, administración ${datosCostos.administracion}. Devuelve una explicación clara y transparente.`
    }
  ];
  const res = await llamarGroqConFallback('costos', mensajesParam);
  return res?.choices?.[0]?.message?.content || '';
}

export async function runChatAssistant({ mensaje, historial = [], guardadosIds = [], viviendasGuardadas = [] }) {
  console.log('[Chat] Mensaje recibido:', mensaje);
  console.log('[Chat] Modelo activo (chat):', modelosActivos.chat || MODELOS.chat[0]);

  const sessionNote = guardadosIds.length > 0
    ? `\n\n[Contexto de la sesión actual: el usuario tiene guardados los inmuebles con IDs: ${guardadosIds.join(', ')}. Si pide comparar sus guardados, llama a comparar_inmuebles con esos IDs.]`
    : `\n\n[Contexto de la sesión actual: el usuario aún no tiene inmuebles guardados. Si pide comparar sus guardados, indícale amablemente que guarde 2 o 3 opciones primero o busca alternativas para él.]`;

  const historyMessages = (Array.isArray(historial) ? historial : []).slice(-10).map((m) => ({
    role: m.rol === 'assistant' ? 'assistant' : 'user',
    content: m.contenido
  }));

  const messagesParam = [
    { role: 'system', content: HABI_SYSTEM_PROMPT + sessionNote }
  ];

  if (Array.isArray(viviendasGuardadas) && viviendasGuardadas.length > 0) {
    messagesParam.push({
      role: 'system',
      content: 'Viviendas guardadas del usuario: ' + JSON.stringify(viviendasGuardadas)
    });
  }

  messagesParam.push(...historyMessages);
  messagesParam.push({ role: 'user', content: mensaje });

  const recommendedMap = new Map();
  let filtrosSugeridos = {};
  let finalText = '';

  try {
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const completion = await llamarGroqConFallback('chat', messagesParam, CHAT_TOOLS_SCHEMA);
      const respuesta = completion;
      console.log('[Chat] Respuesta Groq:', JSON.stringify(respuesta));

      const choice = completion?.choices?.[0];
      const assistantMsg = choice?.message;

      if (!assistantMsg) {
        throw new Error('Respuesta vacía del modelo Groq.');
      }

      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        finalText = (assistantMsg.content || '').trim();
        break;
      }

      messagesParam.push({
        role: 'assistant',
        content: assistantMsg.content || '',
        tool_calls: assistantMsg.tool_calls
      });

      for (const toolCall of assistantMsg.tool_calls) {
        const fnName = toolCall.function?.name;
        let parsedArgs = {};
        try {
          parsedArgs = toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};
        } catch {
          parsedArgs = {};
        }

        const toolOutput = await executeChatTool(fnName, parsedArgs);

        if (Array.isArray(toolOutput.inmuebles_completos)) {
          for (const item of toolOutput.inmuebles_completos) {
            recommendedMap.set(item.id, item);
          }
        }

        if (toolOutput.filtros_sugeridos && Object.keys(toolOutput.filtros_sugeridos).length > 0) {
          filtrosSugeridos = toolOutput.filtros_sugeridos;
        }

        const payloadForModel = { ...toolOutput };
        delete payloadForModel.inmuebles_completos;

        messagesParam.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(payloadForModel)
        });
      }

      if (iteration === MAX_TOOL_ITERATIONS - 1) {
        const closing = await llamarGroqConFallback('chat', messagesParam, null);
        console.log('[Chat] Respuesta Groq (cierre):', JSON.stringify(closing));
        finalText = (closing?.choices?.[0]?.message?.content || '').trim();
      }
    }
  } catch (error) {
    console.error('[Chat] Error completo:', error.message, error.stack);
    finalText = 'Encontré opciones disponibles en Bogotá según tu búsqueda. Revisa los detalles y confirma disponibilidad con nuestro asesor.';
  }

  if (!finalText) {
    finalText = 'Encontré opciones disponibles en Bogotá según tu búsqueda. Revisa los detalles y confirma disponibilidad con nuestro asesor.';
  }

  const inmuebles = Array.from(recommendedMap.values()).slice(0, 5);

  return {
    respuesta: finalText,
    inmuebles,
    filtros_sugeridos: filtrosSugeridos
  };
}
