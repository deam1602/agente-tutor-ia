import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { audioData, type } = body;

    if (!audioData) {
      return NextResponse.json(
        { error: 'No se recibió ningún dato de audio/texto' },
        { status: 400 }
      );
    }

    if (type === 'speech-to-text') {
      /* 
        Procesar el audio recibido y convertirlo a texto interactuando con Whisper API,
        Google Speech API  o alguna asi 
      */

      return NextResponse.json({
        text: 'Transcripción de prueba del audio (Speech-to-Text simulado).'
      });

    } else if (type === 'text-to-speech') {
      /* 
          Procesar texto y convertirlo en stream de audio
      */

      return NextResponse.json({
        success: true,
        message: 'Audio generado simulado (Text-to-Speech simulado).'
      });
    }

    return NextResponse.json(
      { error: 'Tipo de operación no válida. Use speech-to-text o text-to-speech' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en /api/speech:', error);
    return NextResponse.json(
      { error: 'Error interno en el servidor de voz.' },
      { status: 500 }
    );
  }
}
