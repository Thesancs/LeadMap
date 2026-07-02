import { NextRequest, NextResponse } from 'next/server';
import { EvolutionClient } from '@/lib/evolution-client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ instance: string }> }
) {
  try {
    const { instance } = await params;
    const chats = await EvolutionClient.findChats(instance);
    console.log(`Chats response for ${instance}:`, JSON.stringify(chats, null, 2));
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    const message = error instanceof Error ? error.message : 'Falha ao buscar chats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
