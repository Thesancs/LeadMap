# LeadMap

LeadMap is an internal All In Holding prospecting tool for finding, qualifying, and contacting B2B leads, focused on restaurants and small businesses for EnergyZapp outreach.

The current implementation includes the original Google Places MVP plus ongoing WhatsApp Pro capabilities through Evolution API.

## Main Capabilities

- Lead discovery through Google Places API.
- Supabase-backed lead storage, deduplication, status tracking, notes, and CSV export.
- AI-assisted message generation with OpenAI.
- Configurable WhatsApp, Instagram, and LinkedIn message templates.
- WhatsApp instance management through Evolution API, including QR Code connection, warmup tracking, round-robin sending, chat/message views, and lead linking.

## Required Environment

Create `.env.local` with the keys needed by the features you run:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_PLACES_API_KEY=
OPENAI_API_KEY=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_WEBHOOK_SECRET=
CRON_SECRET=
```

`EVOLUTION_WEBHOOK_SECRET` is required for the Evolution webhook in production. Send it as either:

```text
Authorization: Bearer <secret>
```

or:

```text
x-webhook-secret: <secret>
```

## Development

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Database

The Supabase schema and incremental migrations are tracked in the root SQL files:

- `supabase_schema.sql`
- `migration_v2.sql`
- `migration_v2_1_chat.sql`
- `migration_v2_3_whatsapp_messages.sql`
- `migration_v3_next_steps.sql`

Apply them in order for a fresh environment.

## AIOX Workflow

Development should start from a story under `docs/stories/`. Keep each story checklist and file list updated before closing work.
