/**
 * HABITABOGOTÁ — /src/services/groq.js
 * Cliente de Groq SDK y bucle de ejecución de herramientas (máximo 3 iteraciones).
 */

import Groq from 'groq-sdk';
import { AppError } from '../middleware/errorHandler.js';
import { CHAT_TOOLS_SCHEMA, executeChatTool } from './chatTools.js';

export const HABI_SYSTEM_PROMPT = `Eres Habi, el asistente de la plataforma inmobiliaria. Hablas en español colombiano, cercano y claro. Ayudas a encontrar el mejor inmueble según zona, presupuesto y necesidades (mascotas, parqueadero, balcón, zonas comunes, cercanía a transporte masivo y seguridad). Reglas: (1) Usa SIEMPRE las herramientas para buscar; nunca inventes inmuebles, precios ni datos. (2) Si falta información esencial (zona, presupuesto, arriendo o compra), pregunta máximo una o dos cosas antes de buscar. (3) Muestra siempre el costo total (arriendo + administración) y explica brevemente por qué cada recomendación encaja, mencionando distancia a transporte y si hay zona de riesgo cercana. (4) Si no hay resultados, sugiere relajar un filtro concreto y ofrece una alternativa real. (5) Recomienda confirmar requisitos y disponibilidad con el asesor. (6) Solo atiendes temas de la plataforma inmobiliaria; si preguntan otra cosa, redirige amablemente. (7) Respuestas cortas, máximo 120 palabras salvo que pidan una comparación.`;

const MAX_TOOL_ITERATIONS = 3;

export async function runChatAssistant({ mensaje, historial = [], guardadosIds = [] }) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;

  if (!apiKey || !model) {
    throw new AppError(
      'El servicio de asistente IA no está configurado completamente en el servidor (revisa GROQ_API_KEY y GROQ_MODEL).',
      503,
      'GROQ_NOT_CONFIGURED'
    );
  }

  const groq = new Groq({ apiKey });

  // Contexto no intrusivo de la sesión para resolver solicitudes como "Compara mis guardados"
  const sessionNote = guardadosIds.length > 0
    ? `\n\n[Contexto de la sesión actual: el usuario tiene guardados los inmuebles con IDs: ${guardadosIds.join(', ')}. Si pide comparar sus guardados, llama a comparar_inmuebles con esos IDs.]`
    : `\n\n[Contexto de la sesión actual: el usuario aún no tiene inmuebles guardados. Si pide comparar sus guardados, indícale amablemente que guarde 2 o 3 opciones primero o busca alternativas para él.]`;

  const messages = [
    { role: 'system', content: HABI_SYSTEM_PROMPT + sessionNote },
    ...historial.slice(-10).map((m) => ({
      role: m.rol === 'assistant' ? 'assistant' : 'user',
      content: m.contenido
    })),
    { role: 'user', content: mensaje }
  ];

  const recommendedMap = new Map();
  let filtrosSugeridos = {};
  let finalText = '';

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    let completion;
    try {
      completion = await groq.chat.completions.create({
        model,
        messages,
        tools: CHAT_TOOLS_SCHEMA,
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 700
      });
    } catch (err) {
      const status = err?.status || 502;
      if (status === 429) {
        throw new AppError(
          'Habi está recibiendo muchas consultas en este momento. Intenta de nuevo en unos segundos.',
          429,
          'GROQ_RATE_LIMIT'
        );
      }
      throw new AppError(
        'No pudimos conectar con el asistente en este momento. Intenta de nuevo.',
        502,
        'GROQ_API_ERROR'
      );
    }

    const choice = completion?.choices?.[0];
    const assistantMsg = choice?.message;

    if (!assistantMsg) {
      throw new AppError('Respuesta vacía del asistente.', 502, 'GROQ_EMPTY_RESPONSE');
    }

    // Si no pidió herramientas, terminamos con su respuesta final
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      finalText = (assistantMsg.content || '').trim();
      break;
    }

    // Registrar la petición de herramientas del asistente
    messages.push({
      role: 'assistant',
      content: assistantMsg.content || '',
      tool_calls: assistantMsg.tool_calls
    });

    // Ejecutar cada herramienta solicitada en el servidor
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

      // Enviar al modelo únicamente el resumen limpio sin sobrecargar el contexto
      const payloadForModel = { ...toolOutput };
      delete payloadForModel.inmuebles_completos;

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(payloadForModel)
      });
    }

    // Si llegamos a la última iteración tras herramientas, pedimos cierre sin más herramientas
    if (iteration === MAX_TOOL_ITERATIONS - 1) {
      const closing = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 600
      });
      finalText = (closing?.choices?.[0]?.message?.content || '').trim();
    }
  }

  if (!finalText) {
    finalText = 'Encontré estas opciones reales en Bogotá según tu búsqueda. Revisa los detalles y confirma disponibilidad con nuestro asesor.';
  }

  const inmuebles = Array.from(recommendedMap.values()).slice(0, 5);

  return {
    respuesta: finalText,
    inmuebles,
    filtros_sugeridos: filtrosSugeridos
  };
}
