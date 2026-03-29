# EasyChat I18n Architecture Rules

Date: 2026-03-28

This file defines the required i18n architecture for EasyChat.

These are repository rules, not suggestions.

## Purpose

EasyChat must use a single i18n system for all user-visible copy across React components, services, bot adapters, mock data, and error handling.

The goal is to prevent the project from drifting back into mixed patterns such as:

- props-based translation plumbing
- direct locale branching inside business logic
- localized copy embedded in runtime config or bot definitions

## Source Of Truth

All user-visible copy must come from `src/i18n/messages/*`.

Allowed exceptions are limited to:

- non-user-facing developer errors
- test-only data that is explicitly local to a test

## React Rules

### 1. Components must use `useI18n()`

React components must read translated copy through `src/i18n/useI18n.ts`.

Do not pass translation helpers or translated labels through props.

Disallowed examples:

- `t` props
- `messages` props for translated strings
- `labels` props for translated strings

Allowed examples:

- business data props
- callback props
- presentation props that are not localized copy

### 2. Root rendering must provide `AppI18nProvider`

Any React tree that renders production UI must be wrapped by `AppI18nProvider` using the current app locale.

Tests that render localized UI should also provide the i18n provider.

## Non-React Rules

### 3. Services and adapters must use the shared translator helper

Non-React code must use `createAppTranslator(locale)` from `src/i18n`.

Non-React code must not import locale files directly.

Disallowed examples:

- `if (locale === 'zh-CN') { ... } else { ... }`
- `import zhCN from '../i18n/zh-CN'`
- indexing a locale dictionary inline inside services

### 4. Client/protocol layers should return error types, not final user copy

Network clients and protocol adapters should prefer returning:

- error codes
- structured error objects
- machine-readable failure categories

They should not directly construct final user-facing localized messages.

Final user-facing copy should be mapped at the adapter/service layer through i18n.

## Data Model Rules

### 5. Bot definitions and mock config must stay locale-agnostic

`BotDefinition` and bot/mock runtime config must contain only stable domain data, such as:

- ids
- names
- models
- capabilities
- API config schema

They must not embed localized body copy such as:

- greetings
- reply templates
- config guidance text
- user-facing error messages

### 6. Parameterized copy must use message formatting, not string concatenation

Dynamic copy must use message parameters in the i18n catalog.

Preferred:

- `t('chat.retryProgress', { retryCount, retryLimit })`

Disallowed:

- template-string concatenation of translated prefixes with runtime values
- manual `.replace('{{x}}', value)` translation flows

## Catalog Rules

### 7. Locale catalogs must keep the same keys

`en-US` and `zh-CN` catalogs must expose the same message ids.

Any new key added to one locale must be added to the other locale in the same change.

### 8. Message ids should express ownership

Message ids should reflect the domain that owns the copy.

Preferred examples:

- `sidebar.deleteConfirm`
- `chat.retryAction`
- `bot.error.deepseekApi.auth`

Avoid flat or ambiguous ids such as:

- `delete`
- `retry`
- `title`

## Testing Rules

### 9. Tests should verify behavior through the public i18n flow

When testing localized UI:

- render with `AppI18nProvider`
- assert visible text or accessible labels

When testing services/adapters:

- verify output copy through `createAppTranslator(locale)` driven behavior
- prefer structured error mapping tests over raw locale-branch tests

### 10. Do not reintroduce translation stubs as the main testing pattern

For component tests, avoid defaulting to hand-written `t` stubs.

Use real provider-backed rendering unless the test is explicitly about a lower-level translation helper itself.
