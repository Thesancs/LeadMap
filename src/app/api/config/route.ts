import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('config')
      .select('key, value');

    if (error) throw error;

    const config = data.reduce<Record<string, string | null>>((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json({ config });
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
    const body = await req.json();
    const updates = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }));

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum dado fornecido.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('config')
      .upsert(updates, { onConflict: 'key' })
      .select();

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
