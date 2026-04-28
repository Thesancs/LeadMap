import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase';

const CONFIG_KEY = 'mensagem_padrao';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('config')
      .select('value')
      .eq('key', CONFIG_KEY)
      .single();

    // Se não existir, retorna vazio em vez de erro 404 para o frontend lidar
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ mensagem: data?.value || '' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar configuração';
    console.error('Erro ao buscar configuração:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { mensagem } = await req.json();

    if (typeof mensagem !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem deve ser uma string.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('config')
      .upsert({
        key: CONFIG_KEY,
        value: mensagem,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, config: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao salvar configuração';
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
