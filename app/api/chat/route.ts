import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import fs from 'fs';
import path from 'path';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//const model = process.env.OPENAI_MODEL || 'gpt-5.4';

const model =
  process.env.FINE_TUNED_MODEL ||
  process.env.OPENAI_MODEL ||
  'gpt-5.4';


const tutorPrompt = `
Eres un tutor académico del curso de Pensamiento Computacional.

Tu alcance está limitado únicamente a temas del curso, por ejemplo:
- programación
- algoritmos
- pseudocódigo
- variables
- tipos de datos
- instrucciones
- condicionales
- ciclos
- funciones
- listas, arreglos o matrices
- validación de datos
- lógica de programación
- interpretación de código
- depuración básica

REGLAS ESTRICTAS:
1. SOLO puedes responder temas y preguntas del curso de Pensamiento Computacional (programación básica, lógica, algoritmos, etc).

2. Si la pregunta no pertenece al curso, debes rechazarla amablemente e indicar que solo puedes ayudar con temas de Pensamiento Computacional.

3. NO debes proporcionar código completo ni bloques de código funcionales listos para ejecutar.

4. NO debes resolver tareas completas.

5. Si el usuario responde con frases como "sí", "si", "ok", "dale", "explícalo", "continúa", "hazlo", debes asumir que se refiere al último tema discutido y continuar la explicación sin cambiar de contexto.

6. Cuando el usuario muestre código:
   - debes explicar el error
   - debes describir cómo corregirlo
   - debes usar pseudocódigo o explicación en palabras

7. SOLO puedes mostrar código en casos MUY puntuales:
   - como máximo UNA sola línea corta
   - solo si es indispensable para explicar un símbolo o sintaxis
   - nunca debes mostrar un bloque de varias líneas

8. PROHIBIDO:
   - escribir programas completos
   - reconstruir el código del usuario corregido
   - dar soluciones listas para ejecutar

9. SIEMPRE prioriza:
   - explicación
   - pasos
   - lógica
   - pseudocódigo

10. SÍ puedes:
   - explicar conceptos
   - orientar paso a paso
   - describir la lógica
   - dar pseudocódigo

11. Si el usuario pide código completo, debes rechazarlo amablemente y ofrecer:
   - explicación paso a paso
   - pseudocódigo
   - estructura general
   - revisión de un fragmento que el estudiante ya tenga

Ejemplo correcto:
"Debes agregar dos puntos al final del if"

Ejemplo incorrecto:
(mostrar todo el bloque corregido)

Tu objetivo es guiar al estudiante, no resolverle el ejercicio. Tu tono debe ser claro, académico y útil.

Responde en texto claro, sin usar markdown, sin encabezados con # y sin negritas con *.
`;



function isCourseRelated(text: string) {
  const lower = text.toLowerCase();

  const keywords = [
    'programación',
    'programacion',
    'programar',
    'pensamiento computacional',
    'algoritmo',
    'algoritmos',
    'pseudocódigo',
    'pseudocodigo',
    'variable',
    'variables',
    'tipo de dato',
    'tipos de datos',
    'instrucción',
    'instruccion',
    'instrucciones',
    'condicional',
    'condicionales',
    'if',
    'else',
    'elif',
    'ciclo',
    'ciclos',
    'while',
    'for',
    'función',
    'funciones',
    'funcion',
    'lista',
    'listas',
    'arreglo',
    'arreglos',
    'matriz',
    'matrices',
    'python',
    'código',
    'codigo',
    'error',
    'errores',
    'depurar',
    'depuracion',
    'depuración',
    'lógica',
    'logica',
    'ide',
    'lenguaje de programación',
    'lenguaje de programacion',
    'sintaxis',
    'indentación',
    'indentacion',
    'print',
    'input',
    'parámetro',
    'parametro',
    'argumento',
    'retorno',
    'excepción',
    'excepcion',
    'try',
    'except',
    'string',
    'entero',
    'flotante',
    'booleano'
  ];
  return keywords.some((keyword) => lower.includes(keyword));
}


// validacion si se pide codigo completo
function isAskingForFullCode(text: string) {
  const lower = text.toLowerCase();

  const phrases = [
    'dame el código completo',
    'dame el codigo completo',
    'hazme el código',
    'hazme el codigo',
    'haz el código',
    'haz el codigo',
    'realiza el código',
    'realizame el codigo',
    'resuélvelo completo',
    'resuelvelo completo',
    'dame el programa completo',
    'escríbeme el código',
    'escribeme el codigo',
    'haz el login completo',
    'hazme un login completo',
    'dame la solución completa',
    'dame la solucion completa',
    'dame el código en python',
    'dame el codigo en python',
    'hazme el programa',
    'escribe el programa completo'
  ];
  
  return phrases.some((phrase) => lower.includes(phrase));
}


// validaciond e bloques de codigo para no contestar
function containsCodeBlock(text: string) {
  return (
    text.includes("```") ||
    text.includes("def ") ||
    text.includes("for ") ||
    text.includes("while ") ||
    text.includes("if ") ||
    text.includes("print(") ||
    text.includes("input(")
  );
}


// validacion para continuar con explicacion
function normalizeText(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}


function isFollowUp(text: string) {
  const t = normalizeText(text);

  // palabras base
  const followUpKeywords = [
    'si',
    'ok',
    'dale',
    'continua',
    'explica',
    'explicalo',
    'hazlo',
    'muestralo',
    'sigue',
    'prosigue',
    'dime',
    'adelante',
    'por favor',
    'bueno',
    'vas',
    'bien',
    'claro'
  ];

  // si el mensaje es corto y contiene una de estas palabras para follow-up
  if (t.length <= 30) {
    return followUpKeywords.some((k) => t.includes(k));
  }

  return false;
}


// validacion de coo quiere seguri con la respuesta, con ejemplo, paso a paso, etc
function getFollowUpStyle(text: string) {
  const t = normalizeText(text);

  return {
    withExample: t.includes('ejemplo') || t.includes('con ejemplo'),
    stepByStep:
      t.includes('paso a paso') ||
      t.includes('despacio') ||
      t.includes('mas detalle') ||
      t.includes('mas detallado'),
    shorter:
      t.includes('resumido') ||
      t.includes('mas corto') ||
      t.includes('breve'),
    clearer:
      t.includes('mas claro') ||
      t.includes('mejor explicado') ||
      t.includes('simple'),
    pseudocode:
      t.includes('pseudocodigo') || t.includes('pseudo'),
  };
}


//validacion de cuando el usuario dice gracias o algo parecido
function isGratitude(text: string) {
  const t = text.toLowerCase().trim();
  return [
    'gracias',
    'muchas gracias',
    'graciass',
    'thanks',
    'thank you',
    'te lo agradezco',
    'mil gracias',
    'thx',
    'ty',
    'garcias',
    'gracias!'
  ].some(g => t.includes(g));
}

function isGreeting(text: string) {
  const t = normalizeText(text);
  const greetings = [
    'hola',
    'buenas',
    'buenos dias',
    'buenas tardes',
    'buenas noches',
    'holi',
    'hello',
    'hi',
    'holaa'
  ];
  return greetings.some((g) => t === g || t.startsWith(g + ' '));
}

function isFarewell(text: string) {
  const t = normalizeText(text);
  const farewells = [
    'adios',
    'bye',
    'nos vemos',
    'hasta luego',
    'hasta pronto',
    'chao',
    'cuidate',
    'me voy',
    'chau'
  ];
  return farewells.some((f) => t.includes(f));
}

function isSmallTalk(text: string) {
  const t = normalizeText(text);
  const phrases = [
    'como estas',
    'como estas?',
    'como estas hoy',
    'como te va',
    'que tal',
    'que tal?',
    'como vas',
    'todo bien'
  ];
  return phrases.some((p) => t.includes(p));
}



// posttt ---------------------------------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Los mensajes son obligatorios.' },
        { status: 400 }
      );
    }

    //limpia mensajes
    const formattedMessages = messages
      .filter(
        (msg: any) =>
          msg &&
          typeof msg.role === 'string' &&
          typeof msg.content === 'string' &&
          msg.content.trim() !== ''
      )
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content.trim(),
      }));

    if (formattedMessages.length === 0) {
      return NextResponse.json(
        { error: 'No hay mensajes válidos para procesar.' },
        { status: 400 }
      );
    }

    const lastUserMessage = [...formattedMessages]
      .reverse()
      .find((msg: any) => msg.role === 'user');

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No se encontró un mensaje del usuario.' },
        { status: 400 }
      );
    }

    const extraInstructions: { role: 'system'; content: string }[] = [];

    // saludo
    if (isGreeting(lastUserMessage.content)) {
      return NextResponse.json({
        content:
          '¡Hola! 👋 Puedo ayudarte con dudas de Pensamiento Computacional, como algoritmos, lógica, pseudocódigo, programación básica e interpretación de código.',
      });
    }

    // agradecimiento
    if (isGratitude(lastUserMessage.content)) {
      return NextResponse.json({
        content:
          '¡De nada! 😊 Si tienes otra duda de Pensamiento Computacional, aquí estoy para ayudarte.',
      });
    }

    // despedida
    if (isFarewell(lastUserMessage.content)) {
      return NextResponse.json({
        content:
          '¡Hasta luego! 👋 Cuando quieras, puedo seguir ayudándote con temas de Pensamiento Computacional.',
      });
    }

    if (isSmallTalk(lastUserMessage.content)) {
      const responses = [
        '¡Todo bien! 😊 Listo para ayudarte con Pensamiento Computacional. ¿En qué tema te ayudo?',
        '¡Muy bien! 💡 Preparado para resolver tus dudas. ¿En qué tema de Pensamiento Computacional te ayudo?',
        '¡Genial! 😄 Aquí listo para ayudarte con el curso. ¿En qué tema de Pensamiento Computacional te ayudo?',
        '¡Todo en orden! 🚀 ¿Qué quieres aprender hoy?'
      ];
      return NextResponse.json({
        content: responses[Math.floor(Math.random() * responses.length)]
      });
    }


    if (isFollowUp(lastUserMessage.content)) {
      const style = getFollowUpStyle(lastUserMessage.content);

      let followUpInstruction =
        'El usuario está pidiendo continuar con el último tema discutido. Debes retomar la explicación anterior sin cambiar de contexto y sin pedir aclaración innecesaria.';

      if (style.withExample) {
        followUpInstruction +=
          ' Incluye un ejemplo sencillo, pero no uses bloques de código.';
      }
      if (style.stepByStep) {
        followUpInstruction += ' Explica paso a paso.';
      }
      if (style.shorter) {
        followUpInstruction += ' Responde de forma breve y resumida.';
      }
      if (style.clearer) {
        followUpInstruction += ' Usa lenguaje más claro y sencillo.';
      }
      if (style.pseudocode) {
        followUpInstruction +=
          ' Si hace falta, usa pseudocódigo breve y no código real.';
      }
      extraInstructions.push({
        role: 'system',
        content: followUpInstruction,
      });
    }


    else if (!isCourseRelated(lastUserMessage.content)) {
      return NextResponse.json({
        content:
          'Solo puedo responder preguntas relacionadas con el curso de Pensamiento Computacional. Puedo ayudarte con conceptos, lógica, algoritmos, pseudocódigo, interpretación de código y programación básica.',
      });
    }


    if (isAskingForFullCode(lastUserMessage.content)) {
      return NextResponse.json({
        content:
          'Puedo ayudarte a resolverlo sin darte el código completo. Te explico la lógica, los pasos, el pseudocódigo o reviso un fragmento que ya tengas para que tú construyas la solución.',
      });
    }

    // caragar dataset
    /*const dataset = loadDataset();
    const context = getContextFromDataset(dataset);*/

    const response = await client.responses.create({
      model,
      input: [
        {
          role: 'system',
          content: tutorPrompt,
        },
        ...extraInstructions,
        ...formattedMessages,
      ],
    });

    let output = response.output_text;

    // BLOQUEAR BLOQUES DE codigo
    if (containsCodeBlock(output)) {
      const rewriteResponse = await client.responses.create({
        model,
        input: [
          {
            role: 'system',
            content: `
            Eres un tutor académico del curso de Pensamiento Computacional.

            Debes reformular respuestas para que:
            - NO incluyan bloques de código
            - NO incluyan programas completos
            - NO incluyan soluciones listas para ejecutar
            - expliquen la corrección de forma directa
            - indiquen exactamente qué está mal
            - indiquen cómo corregirlo en palabras
            - si es útil, usen pseudocódigo o pasos numerados
            - solo permitan mencionar como máximo una línea corta de sintaxis, nunca un bloque

            Tu respuesta debe ser concreta, útil y didáctica.
            `,
          },
          {
            role: 'user',
            content: `
            Reformula esta respuesta para que no muestre código y explique la corrección solo en palabras o pseudocódigo breve.

            Respuesta original:
            ${output}
            `,
          },
        ],
      });

      output = rewriteResponse.output_text;
    }

    return NextResponse.json({
      content: output,
    });


  } catch (error: any) {
    console.error('Error en /api/chat:', error);

    return NextResponse.json(
      {
        error: 'Ocurrió un error al generar la respuesta.',
        detail: error?.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}