import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const warmupDaysTotal = Math.max(1, Number(body.warmup_days_total ?? 14) || 14);
    const initialDailyLimit = Math.max(1, Number(body.daily_limit ?? 20) || 20);

    const { data, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .update({
        warmup_started_at: new Date().toISOString(),
        warmup_days_current: 0,
        warmup_days_total: warmupDaysTotal,
        daily_limit: initialDailyLimit,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ instance: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao iniciar warmup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
