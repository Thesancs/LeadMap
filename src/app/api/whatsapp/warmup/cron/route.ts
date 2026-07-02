import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const MAX_DAILY_LIMIT = 80;
const START_DAILY_LIMIT = 20;

function nextDailyLimit(currentDay: number, totalDays: number) {
  if (totalDays <= 1) return MAX_DAILY_LIMIT;
  const progress = Math.min(currentDay, totalDays) / totalDays;
  return Math.round(START_DAILY_LIMIT + (MAX_DAILY_LIMIT - START_DAILY_LIMIT) * progress);
}

export async function GET(req: NextRequest) {
  try {
    const configuredSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (configuredSecret && providedSecret !== configuredSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: instances, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .not('warmup_started_at', 'is', null);

    if (error) throw error;

    const updates = await Promise.all((instances ?? []).map(async (instance) => {
      const currentDay = Math.min(
        Number(instance.warmup_days_current ?? 0) + 1,
        Number(instance.warmup_days_total ?? 14),
      );

      const dailyLimit = nextDailyLimit(currentDay, Number(instance.warmup_days_total ?? 14));
      const completed = currentDay >= Number(instance.warmup_days_total ?? 14);

      const { error: updateError } = await supabaseAdmin
        .from('whatsapp_instances')
        .update({
          warmup_days_current: currentDay,
          daily_limit: dailyLimit,
          warmup_started_at: completed ? null : instance.warmup_started_at,
        })
        .eq('id', instance.id);

      return {
        id: instance.id,
        instance_name: instance.instance_name,
        warmup_days_current: currentDay,
        daily_limit: dailyLimit,
        completed,
        error: updateError?.message,
      };
    }));

    return NextResponse.json({ updated: updates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao executar warmup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
