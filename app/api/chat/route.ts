import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Formato de mensajes inválido.' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'tu_clave_api_aqui') {
      return NextResponse.json({
        role: 'system',
        content: `⚠️ **API de OpenAI no configurada.**\n\nPor favor, ingresa tu \`OPENAI_API_KEY\` y \`FINE_TUNED_MODEL_ID\` válidos en el archivo \`.env.local\`. El mensaje que intentaste enviar fue: "${messages[messages.length - 1]?.content}"`
      }, { status: 200 });
    }

    const isModelValid = process.env.FINE_TUNED_MODEL_ID &&
      process.env.FINE_TUNED_MODEL_ID.trim() !== '' &&
      process.env.FINE_TUNED_MODEL_ID !== 'tu_id_de_modelo_aqui';

    const modelo = isModelValid ? process.env.FINE_TUNED_MODEL_ID : 'gpt-3.5-turbo';

    const response = await openai.chat.completions.create({
      model: modelo as string,
      messages: [
        {
          role: "system",
          content: "Eres un Agente Tutor IA especializado en Pensamiento Computacional. Tu objetivo es explicar conceptos a los estudiantes, resolver dudas mediante pseudocódigo o fragmentos parciales explicativos, pero nunca debes entregar el código fuente final listo para ejecutar."
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const botMessage = response.choices[0].message;

    return NextResponse.json({
      role: botMessage.role,
      content: botMessage.content
    });

  } catch (error: any) {
    console.error('Error en /api/chat:', error);

    return NextResponse.json(
      { error: error.message || 'Error comunicándose con el modelo de Lenguaje.' },
      { status: 500 }
    );
  }
}
