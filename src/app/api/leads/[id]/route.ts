import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    const validStatus = ['novo', 'contatado', 'respondido', 'sem_interesse', 'fechado', 'excluido'];
    if (!status || !validStatus.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido ou não fornecido.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ 
        status,
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
