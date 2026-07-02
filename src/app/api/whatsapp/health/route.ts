import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { WhatsAppInstance } from '@/types';
import { calculateRisk } from '@/lib/health-utils';
import { EvolutionClient } from '@/lib/evolution-client';

export type InstanceRisk = 'healthy' | 'warning' | 'blocked';

export interface InstanceHealth {
  id: string;
  instance_name: string;
  display_name: string;
  status: WhatsAppInstance['status'];
  daily_limit: number;
  sent_today: number;
  avg_7d: number;
  pct_limit: number;
  risk: InstanceRisk;
}

export interface HealthResponse {
  instances: InstanceHealth[];
  summary: {
    total: number;
    healthy: number;
    warning: number;
    blocked: number;
  };
}

export async function GET() {
  try {
    const { data: instances, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id, instance_name, display_name, status, daily_limit')
      .order('display_name', { ascending: true });

    if (error) throw error;
    if (!instances || instances.length === 0) {
      return NextResponse.json<HealthResponse>({
        instances: [],
        summary: { total: 0, healthy: 0, warning: 0, blocked: 0 },
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    // 7-day window: from 6 days ago at midnight through end of today
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const metrics: InstanceHealth[] = await Promise.all(
      instances.map(async (inst) => {
        let liveStatus = inst.status as WhatsAppInstance['status'];

        try {
          const live = await EvolutionClient.getInstanceStatus(inst.instance_name);
          liveStatus = live.instance.state;

          if (liveStatus !== inst.status) {
            await supabaseAdmin
              .from('whatsapp_instances')
              .update({ status: liveStatus })
              .eq('id', inst.id);
          }
        } catch {
          // Instance not found in Evolution API — treat as disconnected
          liveStatus = 'close';
          if (inst.status !== 'close') {
            await supabaseAdmin
              .from('whatsapp_instances')
              .update({ status: 'close' })
              .eq('id', inst.id);
          }
        }

        const [{ count: sentToday }, { count: sentWeek }] = await Promise.all([
          supabaseAdmin
            .from('message_logs')
            .select('*', { count: 'exact', head: true })
            .eq('instance_id', inst.id)
            .eq('channel', 'whatsapp')
            .eq('status', 'sent')
            .gte('created_at', todayStart.toISOString()),
          supabaseAdmin
            .from('message_logs')
            .select('*', { count: 'exact', head: true })
            .eq('instance_id', inst.id)
            .eq('channel', 'whatsapp')
            .eq('status', 'sent')
            .gte('created_at', weekStart.toISOString()),
        ]);

        const today = sentToday ?? 0;
        const avg7d = Math.round((sentWeek ?? 0) / 7);
        const pctLimit =
          inst.daily_limit > 0 ? Math.round((today / inst.daily_limit) * 100) : 0;

        const risk: InstanceRisk = calculateRisk(pctLimit, liveStatus);

        return {
          id: inst.id,
          instance_name: inst.instance_name,
          display_name: inst.display_name,
          status: liveStatus,
          daily_limit: inst.daily_limit,
          sent_today: today,
          avg_7d: avg7d,
          pct_limit: pctLimit,
          risk,
        };
      }),
    );

    const summary = {
      total: metrics.length,
      healthy: metrics.filter(m => m.risk === 'healthy').length,
      warning: metrics.filter(m => m.risk === 'warning').length,
      blocked: metrics.filter(m => m.risk === 'blocked').length,
    };

    return NextResponse.json<HealthResponse>({ instances: metrics, summary });
  } catch (error) {
    console.error('Erro ao calcular health das instâncias:', error);
    return NextResponse.json({ error: 'Falha ao calcular health' }, { status: 500 });
  }
}
