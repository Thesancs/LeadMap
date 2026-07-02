import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? 5) || 5, 20);

    const { data, error } = await supabaseAdmin
      .from('search_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ searches: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar histórico';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
