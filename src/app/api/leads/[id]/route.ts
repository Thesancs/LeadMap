import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ lead: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar lead';
    console.error('Erro ao buscar lead:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ lead: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar lead';
    console.error('Erro ao atualizar lead:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
