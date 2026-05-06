# Context

Convert hardcoded English UI copy in React components to Tamanu's translation
components (`TranslatedText`, `TranslatedEnum`, `TranslatedReferenceData`).
Aim for complete visible-copy coverage while choosing string IDs that will age
well.

For changes to existing copy (rather than introducing translations), see
@llm/project-rules/update-copy.md.

# Process

## Translation Steps

1. **Import translation components**: usually
   `import { TranslatedText } from '@tamanu/ui-components';`. Add
   `TranslatedEnum` for enum labels and `TranslatedReferenceData` for
   reference data values when needed.
2. **Find all visible copy in the touched component**: button text, modal
   titles/body text, labels, placeholders, helper text, tooltips, table
   titles/columns, tabs, menu items, empty states, success/error toasts,
   confirm/cancel text props, and inline messages.
3. **Search for an existing ID before creating a new one**. Reuse an existing
   `stringId` when the fallback and meaning match. Prefer nearby domain
   patterns over inventing a new prefix.
4. **Wrap hardcoded text**:

   ```jsx
   <TranslatedText stringId="appropriate.category.key" fallback="Hardcoded Text" />
   ```

## Coverage Guidance

- Translate user-facing static English, including strings passed as props
  such as `title`, `label`, `helperText`, `confirmText`, `cancelText`,
  toast messages, and table column titles.
- Props that must receive a plain string (e.g. `placeholder`) cannot accept
  a `TranslatedText` element — resolve them with `getTranslation` from
  `useTranslation()`:

  ```jsx
  const { getTranslation } = useTranslation();
  // ...
  <TextInput placeholder={getTranslation('patient.search.placeholder', 'Search patients')} />
  ```
- Translate repeated fragments consistently across the same file or feature.
- Do not translate test IDs, internal codes, route names, object keys,
  analytics/event names, log messages intended only for developers, or
  values that already come from user/data/config.
- If a string is assembled from multiple literals, prefer one translated
  sentence with replacements over translating fragments.

## Choosing String IDs

Pick the most reusable ID that still preserves meaning in future contexts:

- Use `general.action.*` for common UI actions where the same English word
  means the same thing everywhere: `save`, `cancel`, `add`, `delete`,
  `remove`, `edit`, `view`, `search`, `clear`, `confirm`, `back`,
  `continue`.
- Use `general.*.label` or existing `general.localisedField.*` IDs for
  broadly shared healthcare/admin concepts: patient, facility, clinician,
  date of birth, sex, location, status.
- Use a domain prefix when the text has domain meaning or should not be
  reused globally: `appointment.*`, `medication.*`, `vaccine.*`, `patient.*`,
  `lab.*`, `admin.settings.*`.
- Use context-specific IDs for complete sentences, warnings, modal body
  text, success/error messages, and copy whose wording depends on workflow
  context.
- Avoid component-path IDs unless the component name is also the stable
  product concept. Prefer `appointment.modal.cancel.text` over
  `cancelAppointmentModal.body.text`.
- Do not create a new specific ID for generic text already covered by
  `general.*`, but also do not force domain-specific text into `general.*`
  just because the fallback is short.
- Keep `stringId` values as static string literals in normal component code.
  Do not build them with template strings, concatenation, or variables
  except in established registry/helper patterns (e.g. `getEnumStringId`,
  `getReferenceDataStringId`) that intentionally map known keys.

## Messages with Dynamic Content

1. **Simple variables** — use replacement tokens:

   ```jsx
   <TranslatedText
     stringId="message.with.variable"
     fallback="You have :count items remaining"
     replacements={{ count: itemCount }}
   />
   ```

2. **Nested translated terms** — resolve the inner term with
   `getTranslation` from `useTranslation()` so the replacement stays a plain
   string:

   ```jsx
   const { getTranslation } = useTranslation();

   // ...

   return (
     <TranslatedText
       stringId="general.dischargingClinician.label"
       fallback="Discharging :clinician"
       replacements={{
         clinician: getTranslation('general.localisedField.clinician.label.short', 'Clinician'),
       }}
     />
   );
   ```

3. **Styled or complex JSX** — split the sentence only when replacements
   cannot express it cleanly. Keep each fallback grammatical enough for
   translators to understand.

## TranslatedEnum for Enums

Use `TranslatedEnum` for enum values that are registered in the enum
translation registry:

```jsx
<TranslatedEnum value={enumValue} enumValues={ENUM_LABELS_CONSTANT} />
```

Import enum label constants from `@tamanu/constants` when that is the
existing pattern. If an enum is not registered yet, add it to the enum
translation registry rather than translating each displayed value with
one-off `TranslatedText` IDs.

## TranslatedReferenceData for Reference Data

Use `TranslatedReferenceData` for names that come from reference data
records, such as facilities, locations, departments, lab test panels,
scheduled vaccines, and program registry conditions:

```jsx
<TranslatedReferenceData
  value={referenceData.id}
  fallback={referenceData.name}
  category={referenceData.type}
/>
```

Pass the explicit category string when that matches the existing pattern,
e.g. `category="scheduledVaccine"` or `category="programRegistryCondition"`.
Do not create static `TranslatedText` IDs for individual reference data
values.

## Server-Side / PDF Rendering

PDF certificates and other server-side renders (e.g. files under
`packages/shared/src/utils/patientCertificates`) do not have the React
`TranslationContext`. They get translations from `useLanguageContext()` (in
`pdf/languageContext`) and use plain strings rather than React elements:

```jsx
const { getTranslation, getEnumTranslation } = useLanguageContext();
// ...
<P>{getTranslation('pdf.birthNotification.child.label', 'Child')}</P>
```

Use `getTranslation(stringId, fallback)` for free text and
`getEnumTranslation(enumValues, value)` for enum labels. Do not use
`TranslatedText` / `TranslatedEnum` / `TranslatedReferenceData` components
inside PDF renderers — `@react-pdf/renderer` cannot render them.

# Avoid

- Missing nearby hardcoded copy because it is in a prop rather than JSX
  children.
- Creating IDs like `text1`, `button.click`, or IDs that mirror temporary
  component structure.
- Over-specific IDs such as `patientListView.saveButton.text` when
  `general.action.save` is correct.
- Over-generic IDs such as `general.warning.message` for workflow-specific
  warnings.
- Dynamically constructing `stringId`s in component code; translators and
  extraction tooling rely on stable literal IDs.
- Splitting messages when simple replacements would keep the sentence
  translatable.
- Omitting `fallback`; it should be the original English text.
- Using `TranslatedText` for enum values that already have enum translation
  support.
- Using `TranslatedText` for reference data names that should use
  `TranslatedReferenceData`.

# Notes

- Use Australian/NZ English spelling in fallbacks (e.g. "colour", "centre",
  "organisation").
