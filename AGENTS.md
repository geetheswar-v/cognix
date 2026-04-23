# AGENTS.md

## Scope

- Repository root instructions for AI agents working in this monorepo.
- Keep changes focused and consistent with the existing codebase.

## Stack

- Monorepo with apps in `apps/`.
- Frontend: `apps/web` uses Next.js 16, React 19, shadcn/ui, and Tailwind.
- Backend: `apps/server` uses Bun, Elysia, Drizzle ORM, and PostgreSQL.

## Package Manager

- Use Bun for installs, scripts, and package management.
- Prefer `bun install`, `bun run ...`, and `bunx ...`.
- Do not introduce npm, yarn, or pnpm commands or lockfiles.

## Working Rules

- Inspect the existing implementation before editing.
- Prefer small, targeted changes over broad refactors.
- Match the style and patterns already used in the files you touch.
- Avoid adding new abstractions unless they clearly reduce duplication.

## Frontend Rules

- Use the `@/*` path alias in `apps/web` for imports.
- Prefer existing components in `apps/web/components` and `apps/web/components/ui` before creating new ones.
- Keep imports direct; avoid barrel-file imports when a direct path exists.
- Treat `apps/web/app` as the App Router source of truth for pages, layouts, and route groups.
- Respect `NEXT_PUBLIC_API_URL` and the `/api/*` rewrite when changing client-server calls.

## Backend Rules

- Keep backend imports relative; do not assume a path alias exists in `apps/server`.
- Keep route handlers in `apps/server/src/routes` and database code in `apps/server/src/db`.
- Use Drizzle migrations in `apps/server/drizzle/` for schema changes.
- Use Bun-compatible runtime patterns in server code.

## Database And Infra

- Local Postgres is defined in `docker-compose.yml`.
- Use the existing Drizzle config and migration workflow for schema updates.
- Do not hardcode environment-specific URLs unless the repo already does so.

## Commands

- Frontend dev: `bun run dev` in `apps/web`.
- Frontend build: `bun run build` in `apps/web`.
- Frontend typecheck: `bun run typecheck` in `apps/web`.
- Backend dev: `bun run dev` in `apps/server`.
- Backend migrations: `bun run db:generate` and `bun run db:migrate` in `apps/server`.

## Verification

- Run the smallest relevant check after editing.
- Prefer typecheck, lint, or targeted build steps over full-repo runs when possible.
