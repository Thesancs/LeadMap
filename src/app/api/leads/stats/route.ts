import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Buscar todos os status dos leads (exceto excluídos para a maioria dos contadores)
    // Mas o PRD diz:
    // Buscados: count total (todos que passaram pelo sistema)
    // Salvos: count não-excluídos
    // Novos, Contatados, Fechados: counts específicos
    
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('status');

    if (error) throw error;

    // Buscar contador de buscas na tabela config
    const { data: configData } = await supabaseAdmin
      .from('config')
      .select('value')
      .eq('key', 'search_count')
      .single();
    
    const searchCount = parseInt(configData?.value || '0');

    const stats = {
      buscados: data.length,
      salvos: data.filter(l => l.status !== 'excluido').length,
      novos: data.filter(l => l.status === 'novo').length,
      contatados: data.filter(l => l.status === 'contatado').length,
      respondidos: data.filter(l => l.status === 'respondido').length,
      fechados: data.filter(l => l.status === 'fechado').length,
      requisicoes: searchCount,
    };

    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar estatísticas';
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
