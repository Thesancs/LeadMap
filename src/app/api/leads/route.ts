import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('leads')
      .select('*')
      .neq('status', 'excluido') // Nunca listar excluídos na tabela principal
      .order('created_at', { ascending: false });

    if (status && status !== 'todos') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ leads: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar leads';
    console.error('Erro ao listar leads:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const leadData = await req.json();

    if (!leadData.place_id || !leadData.nome) {
      return NextResponse.json(
        { error: 'Campos "place_id" e "nome" são obrigatórios.' },
        { status: 400 }
      );
    }

    // UPSERT: Insere ou atualiza se o place_id já existir
    const { data, error } = await supabaseAdmin
      .from('leads')
      .upsert({
        place_id: leadData.place_id,
        nome: leadData.nome,
        endereco: leadData.endereco,
        cidade: leadData.cidade,
        telefone: leadData.telefone,
        site: leadData.site,
        rating: leadData.rating,
        total_reviews: leadData.total_reviews,
        categoria: leadData.categoria,
        horario_abertura: leadData.horario_abertura,
        fotos: leadData.fotos || [],
        status: leadData.status || 'novo',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'place_id'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ lead: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao salvar lead';
    console.error('Erro ao salvar lead:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
