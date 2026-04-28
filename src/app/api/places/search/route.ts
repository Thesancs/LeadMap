import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { searchPlaces } from '@/lib/places';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { setor, cidade, minStars, quantidade, horaInicio, horaFim } = await req.json();

    if (!setor || !cidade) {
      return NextResponse.json(
        { error: 'Os parâmetros "setor" e "cidade" são obrigatórios.' },
        { status: 400 }
      );
    }

    const query = `${setor} em ${cidade}`;
    const minRating = parseFloat(minStars || '0');
    const maxResults = parseInt(quantidade || '10');

    // 1. Buscar no Google Places
    let results = await searchPlaces(query, maxResults);

    // Incrementar contador de buscas no Supabase
    await supabaseAdmin.rpc('increment_search_count');

    // 2. Filtrar por estrelas mínimas
    if (minRating > 0) {
      results = results.filter(r => (r.rating || 0) >= minRating);
    }

    // 3. Filtrar por faixa de horário de abertura
    if ((horaInicio && horaInicio !== '00:00') || (horaFim && horaFim !== '23:59')) {
      const startTime = parseInt(horaInicio.replace(':', ''));
      const endTime = parseInt(horaFim.replace(':', ''));
      
      results = results.filter(r => {
        if (!r.horario_abertura) return false;
        const openingTime = parseInt(r.horario_abertura.replace(':', ''));
        return openingTime >= startTime && openingTime <= endTime;
      });
    }

    if (results.length === 0) {
      return NextResponse.json({
        places: [],
        total_found: 0,
        filtered_out: 0,
      });
    }

    // 2. Deduplicação Server-side
    const placeIds = results.map((r) => r.place_id);

    // Consultar no Supabase quais desses IDs já existem
    const { data: existingLeads, error } = await supabaseAdmin
      .from('leads')
      .select('place_id')
      .in('place_id', placeIds);

    if (error) {
      console.error('Erro ao consultar leads existentes:', error);
      // Mesmo com erro no DB, retornamos os resultados do Google para não travar a busca,
      // mas logamos o erro. No MVP, decidimos filtrar se possível.
      return NextResponse.json({
        places: results,
        total_found: results.length,
        filtered_out: 0,
      });
    }

    const existingIds = new Set(existingLeads?.map((e) => e.place_id) || []);
    
    // Filtrar apenas os que NÃO existem no banco
    const filteredResults = results.filter((r) => !existingIds.has(r.place_id));

    return NextResponse.json({
      places: filteredResults,
      total_found: results.length,
      filtered_out: results.length - filteredResults.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno no servidor';
    console.error('Erro na rota /api/places/search:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
