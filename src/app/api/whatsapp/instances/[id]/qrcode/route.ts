import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { EvolutionClient } from '@/lib/evolution-client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Buscar nome da instância no banco
    const { data: instance, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('id', id)
      .single();

    if (error || !instance) throw new Error('Instância não encontrada');

    // 2. Buscar QR Code na Evolution API
    const qrData = await EvolutionClient.getQRCode(instance.instance_name);

    return NextResponse.json(qrData);
  } catch (error) {
    console.error('Erro ao buscar QR Code:', error);
    const message = error instanceof Error ? error.message : 'Falha ao buscar QR Code';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
