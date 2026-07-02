# Story 001: Reconcile SDD, Quality Gates, and Security Baseline

## Status

Ready for Review

## Context

The LeadMap implementation has advanced beyond the SDD v1.0. The current code includes MVP lead search/CRM flows plus WhatsApp Pro, Evolution API integration, warmup logic, message history, and multichannel templates. AIOX governance also requires story-driven work in `docs/stories/`, but this folder was missing.

## User Story

As the LeadMap team, I want the project documentation, quality gates, and security baseline to match the real implementation so future development can proceed through the AIOX workflow without hidden drift.

## Acceptance Criteria

- [x] A `docs/stories/` story exists for the reconciliation work.
- [x] `npm run lint`, `npm run typecheck`, and `npm test` are runnable project gates.
- [x] The SDD documents the current implementation deltas from v1.0.
- [x] README and package metadata identify the project as LeadMap.
- [x] Evolution webhook requests require a configured shared secret outside local development.
- [x] OpenAI prompt inputs are sanitized and truncated before being interpolated.
- [x] Quality gates are executed before completion.

## Tasks

- [x] Create the initial AIOX story under `docs/stories/`.
- [x] Update package scripts and tool scopes for app quality gates.
- [x] Add Evolution webhook shared-secret validation.
- [x] Sanitize and truncate OpenAI prompt inputs.
- [x] Update SDD reconciliation notes.
- [x] Replace boilerplate README with LeadMap-oriented instructions.
- [x] Run lint, typecheck, tests, and build.

## Verification

- `cmd /c npm run lint` - passed with 21 warnings and 0 errors.
- `cmd /c npm run typecheck` - passed.
- `cmd /c npm test` - passed, 47 tests across 4 files.
- `cmd /c npm run build` - passed. Next.js reported the existing `middleware` file convention deprecation warning.

## File List

- `docs/stories/001-sdd-reconciliation-quality-gates.md`
- `package.json`
- `package-lock.json`
- `eslint.config.mjs`
- `vitest.config.ts`
- `src/app/api/whatsapp/webhook/[instance]/route.ts`
- `src/lib/openai.ts`
- `sdd-LeadMapV2`
- `README.md`
- `.gitignore`
