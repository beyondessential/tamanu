# Date formatting locale: setting + browser-locale plumbing

## Context

Date formatting previously hardcoded `en-GB` in the PDF datetime context, while the web UI
followed `navigator.language`. A recent change (`tweak/pdf-intl-locale`) moved both to the
runtime's Intl default locale. That leaves a remaining inconsistency axis: browser-rendered
surfaces follow each user's browser, while server-rendered surfaces (emailed certificates,
patient letters, stored system notes) follow the server's environment locale.

This plan introduces a deployment-level locale setting, sends the browser's formatting
locale on API requests so request-driven server renders match what the user sees, and
brings the remaining formatter call sites in line.

## Locale resolution contract

The effective formatting locale, on every surface, is:

1. **`dateTimeLocale` global setting** — when set, pins the deployment convention and
   overrides everything, everywhere.
2. **The requesting user's browser locale**, where one exists:
   - in the browser, this is implicit — the runtime Intl default *is* the browser locale;
   - for server renders inside an HTTP request (patient letters), the web client sends its
     resolved locale as a request header.
3. **Runtime Intl default** — the server environment locale, for background jobs
   (emailed certificates) when no setting is configured.

**Exception — stored system notes** (Encounter/Triage change notes): skip step 2. These are
shared stored artifacts; their formatting shouldn't depend on which user's browser happened
to trigger the change. They use setting ?? server runtime default.

**Note — patient letters** are also stored (as document attachments), but are generated
interactively and previewed by the creating user, so they render with the full chain
including browser locale. The stored PDF matches what the creator saw.

## Prong 1 — the setting

- `packages/settings/src/schema/global.ts`: add `dateTimeLocale`
  - `yup.string().nullable()`, `defaultValue: null`, `exposedToWeb: true`
  - description: BCP-47 locale used for date/time formatting (e.g. `en-GB`). When unset,
    dates follow the user's browser locale (web) or the server locale (server-rendered
    documents and notes).
  - validate the value is a well-formed BCP-47 tag via `Intl.getCanonicalLocales` in a
    yup `.test`, so a typo'd locale fails import rather than silently falling back.
- `packages/ui-components/src/contexts/DateTimeContext.tsx`:
  - `DateTimeProvider` reads `getSetting('dateTimeLocale')` (alongside the existing
    `facilityTimeZone` read) and passes it to `DateTimeProviderInner`; props mode gains a
    `locale` prop for isolated render roots.
  - `bindTimeZones` passes it as the formatters' 4th argument.
  - Expose `locale` on the context value — the *effective* locale
    (`setting ?? Intl default`) — so one-off consumers (MarTable) use it instead of
    importing the module constant.
- `packages/shared/src/utils/pdf/withDateTimeContext.jsx`:
  - effective locale = `getSetting('dateTimeLocale') ?? props.locale ?? undefined`
    (`props.locale` is the request-supplied browser locale, prong 2).
  - Pass to formatters; expose `locale` on the context value, mirroring ui-components.

## Prong 2 — browser locale on requests

- `packages/web/app/api/TamanuApi.jsx` request interceptor: alongside the existing
  `language` header, set a `locale` header to
  `Intl.DateTimeFormat().resolvedOptions().locale`.
  - Why not `Accept-Language`: that header reflects the browser's content-language
    preference list, not the locale Intl actually formats with; an explicit header also
    matches the existing bare `language` header convention.
- `packages/facility-server/app/createApiApp.js` (~line 65): `req.locale =
  req.headers.locale` next to the existing `req.language` assignment.
- `packages/facility-server/app/utils/makePatientLetter.jsx`: pass `locale: req.locale`
  into the `PatientLetter` render props.
- Central server: certificate renders run in a background job
  (`CertificateNotificationProcessor` → `makePatientCertificate.jsx`) with no request
  context — they get setting ?? server default via prong 1 alone. Audit during
  implementation for any request-driven central renders of `withDateTimeContext`
  components; none found so far.

## Prong 3 — bring outliers in line

- `packages/web/app/components/Medication/Mar/MarTable.jsx:157`: stop importing the
  `locale` module constant; use the effective `locale` from `useDateTime()` (already
  imported in the component), or switch to the context's `formatTimeSlot` if the rendered
  output matches the current display — verify during implementation.
- `packages/ui-components/src/components/DateDisplay/DiagnosticInfo.jsx`: display the
  effective locale from `useDateTime()` so the debug panel reflects what formatting
  actually uses.
- `packages/database/src/models/Encounter.ts:624,630` and `Triage.ts:181,186`: resolve the
  locale once per update via `await this.sequelize.models.Setting.get('dateTimeLocale')`
  (global scope; the update methods are already async) and pass it as the formatters' 4th
  argument alongside `getPrimaryTimeZone(config)`. Null → runtime default. No caller
  signature changes needed.
- `packages/utils/src/dateTime.ts` `locale` constant: remains the no-override fallback
  inside `intlFormatDate`; after this work, direct imports should be down to (at most)
  the `intlFormatDate` internal use.

## Testing

- `packages/utils`: formatter unit tests covering an explicit locale argument producing
  locale-appropriate output (e.g. `en-US` vs `en-GB` day/month order).
- `packages/ui-components`: DateTimeContext test with the setting set vs unset.
- `packages/facility-server`: patient letter creation passes the request `locale` header
  through to the render (plumbing-level assertion).
- Manual sweep: set the setting → web tables, PDF preview, patient letter, emailed
  certificate, and a system note all show the configured convention.

## Out of scope

- Mobile — doesn't use these formatters (fixed date-fns format strings).
- Number/currency formatting locale.
- Per-facility locale override — global only for now; can be added later the same way
  `facilityTimeZone` overrides per facility.

## Resolved decisions

1. Setting key name: `dateTimeLocale` — avoids confusion with `language`, which selects
   translations.
2. Patient letters render with the creating user's browser locale when no setting is
   configured — the stored PDF matches exactly what the creator previewed.
