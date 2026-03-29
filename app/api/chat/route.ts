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

Reglas obligatorias:
1. SOLO respondes preguntas relacionadas con Pensamiento Computacional y programación básica del curso.
2. Si la pregunta no pertenece al curso, debes rechazarla amablemente e indicar que solo puedes ayudar con temas de Pensamiento Computacional.
3. NO debes proporcionar código completo listo para ejecutar.
4. NO debes resolver tareas completas.
5. SÍ puedes:
   - explicar conceptos
   - orientar paso a paso
   - describir la lógica
   - dar pseudocódigo
   - mostrar fragmentos parciales muy cortos y explicativos
6. Si el usuario pide código completo, debes rechazarlo amablemente y ofrecer:
   - explicación paso a paso
   - pseudocódigo
   - estructura general
   - revisión de un fragmento que el estudiante ya tenga

Tu tono debe ser claro, académico y útil.
`;


// CARGANDO DATASET
//const datasetPath = path.join(process.cwd(), 'app/data/pensamiento_computacional_dataset.jsonl');

/*function loadDataset() {
  const file = fs.readFileSync(datasetPath, 'utf-8');
  return file.split('\n').map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}
// GENERANDO CONTEXTO, extrayendo contenido util
function getContextFromDataset(dataset: any[]) {
  return dataset
    .map(item => {
      const user = item.messages.find((m: any) => m.role === 'user')?.content;
      const assistant = item.messages.find((m: any) => m.role === 'assistant')?.content;
      return `Pregunta: ${user}\nRespuesta: ${assistant}`;
    })
    .slice(0, 20) // no mandar todo, solo parte
    .join('\n\n');
}*/

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
    'depurar',
    'lógica',
    'logica',
    'ide',
    'lenguaje de programación',
    'lenguaje de programacion'
  ];

  return keywords.some((keyword) => lower.includes(keyword));
}


function isAskingForFullCode(text: string) {
  const lower = text.toLowerCase();

  const phrases = [
    'dame el código completo',
    'dame el codigo completo',
    'hazme el código',
    'hazme el codigo',
    'resuélvelo completo',
    'resuelvelo completo',
    'dame el programa completo',
    'escríbeme el código',
    'escribeme el codigo',
    'haz el login completo',
    'hazme un login completo',
    'dame la solución completa',
    'dame la solucion completa'
  ];

  return phrases.some((phrase) => lower.includes(phrase));
}


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
        content: msg.content,
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

    if (!isCourseRelated(lastUserMessage.content)) {
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
        ...formattedMessages,
      ],
    });


    return NextResponse.json({
      content: response.output_text,
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