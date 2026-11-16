# Component customisations - Tamanu

How to give one deployment a different version of a web component without
branching the shared component. The mechanism is the `Customisations` wrapper in
`packages/web/app/components/Customisations/`, driven by the
`customisations.componentVersions` global setting.

## When to suggest it

Prefer a customisation over a new feature flag wherever one can do the job.
Suggest it, before writing code, when a request would otherwise:

- add a feature flag, a boolean setting or a deployment check to switch a web
  component's behaviour
- thread a new prop through several layers so one screen can behave differently
- fork a form, field or layout that most deployments should keep as it is

A flag adds a branch to the shared component that every deployment carries. A
customisation leaves the shared component alone and keeps the variant in its own
file.

Reach for a setting (see `llm/project-rules/settings.md`) only when a
customisation can't do it: the difference is a value rather than behaviour, it
must vary per facility, or it reaches the server or mobile. Change the shared
component when every deployment should get the new behaviour.

Say which option you picked and why, so the reviewer can disagree.

## How it works

A call site wraps its default component and gives it a name:

```jsx
<Customisations name="CulturalNameTextField">
  <LocalisedField name="culturalName" component={TextField} />
</Customisations>
```

`Customisations` reads `customisations.componentVersions`, an object of
`{ [name]: version }`. If the setting names a version for this `name` and that
version exports a component called `name`, it renders that component with the
default child's props. Otherwise it renders the child unchanged, so a deployment
with no setting sees no difference.

```json
{ "customisations": { "componentVersions": { "CulturalNameTextField": "qrCodeScanner" } } }
```

## Adding one

1. Create or reuse a version folder under `Customisations/` and export the
   replacement from its `index.jsx`. Register a new folder in `ComponentList` in
   `Customisations/index.jsx`.
2. Name the export exactly as the `name` prop and the settings key. The name is
   passed as a prop because production builds minify function names.
3. Wrap the default component at the call site. The replacement receives the
   same props, so keep it a drop-in: same `name`, same form field contract.
4. Keep the replacement thin. Compose the shared component with different props
   where possible (see `qrCodeScanner/CulturalNameFields.jsx`) so fixes to the
   shared component still reach it.
5. Test both paths: no setting renders the default, the setting renders the
   replacement (see `__tests__/components/AllPatientsSearchBar.test.jsx`).

## Limits

- Web only. Mobile has no equivalent.
- It swaps one component for another. It cannot change server behaviour, data
  shape or validation, so a customisation that needs those also needs a setting
  or a shared change.
- The setting is global, so every facility in a deployment gets the same version.
- The setting is a free-form object: a typo in the name or version silently
  renders the default. Check the rendered screen after setting it.
