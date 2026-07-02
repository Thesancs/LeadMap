import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const CSV_HEADERS = [
  'nome',
  'status',
  'cidade',
  'telefone',
  'site',
  'rating',
  'total_reviews',
  'categoria',
  'endereco',
  'created_at',
];

function escapeCsv(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('leads')
      .select(CSV_HEADERS.join(','))
      .order('created_at', { ascending: false });

    if (status && status !== 'todos') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const csv = [
      CSV_HEADERS.join(','),
      ...(data ?? []).map(row => CSV_HEADERS.map(header => escapeCsv(row[header as keyof typeof row])).join(',')),
    ].join('\r\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leadmap-leads-${status || 'todos'}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao exportar leads';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
