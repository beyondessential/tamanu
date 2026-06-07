# Mobile date formatting locale

## Context

The date-locale work on `feat/date-locale-setting` (PR #9996) gives web and servers a
uniform resolution chain — `dateTimeLocale` setting ?? user-agent locale ?? runtime
default — but mobile was scoped out. This stacks the mobile counterpart on top so one
branch/deploy tests the whole feature.

Mobile today formats dates with date-fns and fixed format strings: the `DateFormats`
constants (`packages/mobile/App/ui/helpers/constants.ts`) consumed via
`formatStringDate`/`formatDate` (`packages/mobile/App/ui/helpers/date.ts`), ~48 call
sites across ~20 UI files. No timezone conversion layer; stored ISO 9075 strings are
displayed as-is (unchanged by this plan).

## Established facts

- **Settings already arrive**: mobile login and setFacility responses include
  `getFrontEndSettings()` (the `exposedToWeb` filter), so `dateTimeLocale` is readable
  reactively via `useSettings().getSetting('dateTimeLocale')` with no server change.
- **Intl is available**: Hermes is enabled and provides `Intl.DateTimeFormat` on
  Android (platform ICU; no APK size impact). Needs a manual on-device sanity check —
  Hermes Intl has minor formatting quirks vs V8/Node.

## Resolution chain on mobile

`dateTimeLocale` setting ?? **device locale** (`Intl.DateTimeFormat().resolvedOptions().locale`)
— the device locale is mobile's analogue of the browser locale. On facility-managed
devices the system locale is deployment-controlled, so this mirrors web exactly.

## Design

Mirror `ui-components`' DateTimeContext in shape, scaled to mobile's needs:

1. **Locale-aware formatters** in `App/ui/helpers/date.ts`: map each `DateFormats`
   constant to an `Intl.DateTimeFormatOptions` bag (same option bags as
   `@tamanu/utils/dateFormatters` where the formats coincide, e.g. `DDMMYY` ↔
   `formatShort`'s options). A formatter takes `(date, format, locale)`; unknown or
   custom date-fns strings fall back to date-fns as today (locale-fixed), so the change
   degrades safely.
2. **`useDateFormatter()` hook** (new, `App/ui/contexts` or alongside SettingsContext):
   resolves effective locale = `getSetting('dateTimeLocale') ?? device Intl default`,
   returns bound formatters + the effective `locale`. Reactive via the existing
   `settingsChanged` event path in SettingsContext.
3. **Mechanical call-site migration**: components currently calling
   `formatStringDate(x, DateFormats.Y)` switch to the hook's bound equivalent.
   Non-component call sites (if any — audit during implementation) receive the locale
   as an argument from the nearest component, or stay on the date-fns fallback when
   they format non-display strings.
4. **Inputs stay fixed**: anything that *parses* user input or builds stored values
   (e.g. DateField internals, ISO conversions) keeps fixed formats — only display
   formatting becomes locale-aware. Audit each DateField/`DateFormats` usage for
   display-vs-parse during migration.

## Out of scope

- Timezone conversion on mobile (no facility/primary timezone layer exists; separate
  concern).
- iOS (app is Android-only in practice; Hermes Intl covers iOS anyway if revived).
- Mobile DB changes — none needed; Setting sync already handles delivery.

## Testing

- Unit tests for the format-constant → Intl mapping at a couple of locales (mobile
  jest runs under Node with full ICU).
- Manual on-device/emulator check that Hermes renders the same strings as the unit
  tests expect (Hermes Intl quirk guard) — note in PR/Linear testing notes.

## Stacking

Commits go on top of `feat/date-locale-setting` and push to PR #9996, so the one
deploy exercises web, server, and mobile together.
