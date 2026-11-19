# Component customisations - Tamanu

`Customisations` (`packages/web/app/components/Customisations/`) swaps a React
component in the web app for a deployment-specific version, chosen by the
`customisations.componentVersions` global setting.

## When to suggest it

Prefer a customisation over a new feature flag where one can do the job. Suggest
it before writing code when a request would add a flag, a deployment check or a
fork to a shared React component in the web app.

Use a setting (`llm/project-rules/settings.md`) only when a customisation can't
do it: the difference is a value, it varies per facility, or it reaches the
server or mobile.

## How it works

```jsx
<Customisations name="CulturalNameTextField">
  <LocalisedField name="culturalName" component={TextField} />
</Customisations>
```

```json
{ "customisations": { "componentVersions": { "CulturalNameTextField": "qrCodeScanner" } } }
```

If the setting maps `name` to a version folder that exports a component called
`name`, that renders with the child's props. Otherwise the child renders
unchanged.

## Adding one

- Export the replacement from a version folder's `index.jsx`; register a new
  folder in `ComponentList`.
- The `name` prop, the export and the settings key must match exactly. A
  mismatch silently renders the default.
- Keep the replacement a thin drop-in that composes the shared component (see
  `qrCodeScanner/CulturalNameFields.jsx`).
- Test both the default and the swapped path (see
  `__tests__/components/AllPatientsSearchBar.test.jsx`).
