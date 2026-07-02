import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { normalizeEvolutionMessages } from '@/lib/whatsapp-normalizers';
import { upsertMessages } from '@/lib/whatsapp-message-store';

function getWebhookSecret(req: NextRequest) {
  const authSecret = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return authSecret || req.headers.get('x-webhook-secret') || '';
}

function validateWebhookSecret(req: NextRequest) {
  const configuredSecret = process.env.EVOLUTION_WEBHOOK_SECRET;

  if (!configuredSecret) {
    return process.env.NODE_ENV !== 'production';
  }

  return getWebhookSecret(req) === configuredSecret;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ instance: string }> }
) {
  try {
    if (!validateWebhookSecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instance } = await params;
    const body = await req.json();

    const event = String(body.event ?? body.type ?? '').toUpperCase();
    if (event && event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const messages = normalizeEvolutionMessages(body, '');
    const validMessages = messages.filter(message => message.key.remoteJid && message.key.id);

    after(async () => {
      try {
        await upsertMessages(validMessages, instance);
      } catch (error) {
        console.error('[whatsapp-webhook] Failed to persist incoming event:', error);
      }
    });

    return NextResponse.json({ ok: true, accepted: validMessages.length });
  } catch (error) {
    console.error('[whatsapp-webhook] Failed to accept incoming event:', error);
    return NextResponse.json({ error: 'Failed to process event' }, { status: 400 });
  }
}
