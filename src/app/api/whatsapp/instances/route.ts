import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { EvolutionClient } from '@/lib/evolution-client';

export async function GET() {
  try {
    const { data: instances, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const instancesWithStatus = await Promise.all((instances || []).map(async (inst) => {
      try {
        const liveStatus = await EvolutionClient.getInstanceStatus(inst.instance_name);
        const liveState = liveStatus.instance.state as string;
        if (liveState !== inst.status) {
          await supabaseAdmin
            .from('whatsapp_instances')
            .update({ status: liveState })
            .eq('id', inst.id);
        }
        return { ...inst, status: liveState };
      } catch {
        // Instance not found in Evolution API — treat as disconnected
        if (inst.status !== 'close') {
          await supabaseAdmin
            .from('whatsapp_instances')
            .update({ status: 'close' })
            .eq('id', inst.id);
        }
        return { ...inst, status: 'close' };
      }
    }));

    return NextResponse.json(instancesWithStatus);
  } catch (error) {
    console.error('Erro ao listar instâncias:', error);
    return NextResponse.json({ error: 'Falha ao listar instâncias' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { display_name, assigned_to } = await req.json();
    
    // Nome técnico da instância (prefixo + timestamp curto)
    const instance_name = `leadmap_${Date.now().toString().slice(-6)}`;

    // 1. Criar na Evolution API
    const evolutionRes = await EvolutionClient.createInstance(instance_name);

    // 2. Salvar no Supabase
    const { data, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .insert({
        instance_name,
        display_name,
        assigned_to: assigned_to || null,
        status: 'close',
        warmup_days_current: 0,
        warmup_days_total: 14,
        daily_limit: 80,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      instance: data, 
      qrcode: evolutionRes.qrcode 
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar instância:', error);
    const message = error instanceof Error ? error.message : 'Falha ao criar instância';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
