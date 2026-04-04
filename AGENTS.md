# EasyChat Agent Guide

This file is the root instruction file for agents working in this repository.

## Scope

These instructions apply to the entire repository unless a deeper `AGENTS.md` overrides them.

## First Read

Before making non-trivial changes, read the following files under `.rules/` and treat them as repository rules:

1. `.rules/project-development-guide.md`
2. `.rules/i18n-architecture-rules.md`
3. `.rules/unit-test-principles.md`
4. `.rules/custom.md`
5. `.rules/superpower.md`

If there is any conflict:

1. Current code behavior
2. `AGENTS.md`
3. `.rules/project-development-guide.md`
4. Other `.rules/*`

Do not ignore the rule documents just because this file exists. This file is an entry point and execution summary, not a replacement for `.rules/`.

## Hard Constraints

- Do not proactively read files under `mydoc/`.
- Do not use git worktree and do not use worktree-related skills.
- Do not use subagents.
- If a superpower workflow requires writing a spec or plan, create the spec or plan when needed, but do not commit those documents unless the user explicitly asks for it.
- Do not revert user changes that are unrelated to the current task.

## Project Overview

EasyChat is a Chrome Side Panel extension for comparing multiple AI assistants side by side.

Current stack:

- Chrome Extension Manifest V3
- React 19
- TypeScript
- Vite
- Tailwind CSS v4 plus SCSS
- Vitest and React Testing Library

Key entry points:

- `src/entry/sidepanel/main.tsx`
- `src/entry/sidepanel/App.tsx`
- `src/entry/background/service-worker.ts`
- `public/manifest.json`

## Code Placement Rules

Keep logic in the correct layer instead of pushing business behavior into React components.

- `src/components`: UI rendering and local interaction only
- `src/store`: app state, reducer, selectors, provider, persistence orchestration
- `src/features`: domain services and business rules
- `src/bots`: bot adapters, clients, parsers, registry
- `src/bots/definitions`: runtime bot metadata and default model definitions
- `src/i18n`: translation catalogs, provider, translation helpers
- `src/types`: shared domain types

When changing behavior, prefer the lowest stable layer that owns the behavior.

## Product And State Invariants

Preserve these repository-level invariants unless the user explicitly requests a behavior change:

- The app compares multiple bots in parallel in the side panel.
- History snapshots are read-only.
- Bot capabilities are accessed through adapter classes, not directly from UI code.
- UI must not directly implement provider/network protocol logic.
- Visible bot panels are derived from layout rules rather than blindly rendering every active bot.

If you suspect an older design note conflicts with the current code, prefer current code behavior and `.rules/project-development-guide.md`.

## I18n Rules

All user-visible copy must follow the shared i18n architecture.

- Use `src/i18n/messages/*` as the source of truth for user-facing copy.
- In React components, use `useI18n()`.
- In non-React code, use shared translator helpers from `src/i18n`.
- Do not hardcode locale branching or import locale dictionaries directly in feature or adapter code.
- When adding a new message key, update both `en-US` and `zh-CN` in the same change.

## Testing Rules

Only add or keep tests that protect core product contracts.

- Prefer tests for reducers, selectors, services, parsers, clients, and adapter behavior.
- Use component tests only for real user interaction contracts.
- Avoid tests that mainly lock down copy, markup shape, demo data, or incidental defaults.
- Prefer factories and focused fixtures over runtime seed data.

When a change affects core behavior, run the narrowest useful tests first, then broader verification if needed.

## Verification Commands

Use the existing npm scripts for verification:

- `npm run test`
- `npm run lint`
- `npm run build`

Choose the smallest command set that gives meaningful confidence for the change. For broad or risky changes, prefer running all relevant checks before finishing.

## Working Style

- Keep changes aligned with existing repository patterns.
- Make minimal, targeted edits unless the user asked for refactoring.
- Prefer clear, maintainable code over clever shortcuts.
- Document assumptions in your response when you had to infer intent from context.
