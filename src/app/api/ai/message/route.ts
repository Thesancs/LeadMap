import { NextRequest, NextResponse } from 'next/server';
import { generateLeadMessage } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { lead, template, channel } = await req.json();

    if (!lead || !template) {
      return NextResponse.json(
        { error: 'Dados do lead e template são obrigatórios.' },
        { status: 400 }
      );
    }

    const message = await generateLeadMessage(lead, template, channel || 'whatsapp');

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Erro na geração de mensagem por IA:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao gerar mensagem';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
