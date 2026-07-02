import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { EvolutionClient } from '@/lib/evolution-client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, ...updates } = await req.json();

    const { data: instance, error: fetchError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !instance) throw new Error('Instância não encontrada');

    if (action === 'logout') {
      await EvolutionClient.logout(instance.instance_name);
    }

    const { data, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao atualizar instância';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: instance, error: fetchError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('id', id)
      .single();

    if (fetchError || !instance) throw new Error('Instância não encontrada');

    // Remove FK-dependent rows first to avoid constraint violations
    await Promise.all([
      supabaseAdmin.from('message_logs').delete().eq('instance_id', id),
      supabaseAdmin.from('whatsapp_messages').delete().eq('instance_name', instance.instance_name),
    ]);

    const { error } = await supabaseAdmin
      .from('whatsapp_instances')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Fire Evolution delete in background — don't block the response
    after(async () => {
      try {
        await EvolutionClient.deleteInstance(instance.instance_name);
      } catch {
        console.warn(`[delete-instance] Instância ${instance.instance_name} já não existia na Evolution`);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao deletar instância';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
