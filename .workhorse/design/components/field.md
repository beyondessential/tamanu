---
title: Field
---
# Field

**Source:** `packages/ui-components/src/components/Field/` + `Form/`
· **Preview:** [`./field.html`](./field.html)

The form field system. `Field` is the Formik wrapper; you tell it *where* the value
lives (`name`) and *what input* to render (`component`). Swapping input type is a
one-line change.

```jsx
<Field
  name="email"
  label={<TranslatedText stringId="user.emailAddress.label" fallback="Email address" />}
  component={TextField}
  required
/>
```

## Key props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `name` | string | — | Formik value path (required; supports nested paths) |
| `component` | component | `TextField` | The input to render |
| `label` | node | — | Field label (rendered above the input by `OuterLabelFieldWrapper`) |
| `required` | bool | — | Adds the required ornament next to the label |
| `helperText` | node | — | Shown below the input; replaced by the error message when errored |
| `disabled` | bool | — | Disables the input |

## Validation behaviour (important)

Errors are shown **only after a submit is attempted** — a field is not marked
invalid while the user is still filling the form out for the first time. After the
first submit attempt, the field re-validates on every change. When errored, the
input turns red and the error message replaces `helperText`. Don't build your own
"touched" tracking; `Field` already does submit-attempt gating.

## Input components (use as `component={…}`)

| Component | Path | Renders |
|---|---|---|
| `TextField` / `TextInput` | `Field/TextField.jsx` | Outlined text input (also `MultilineTextField`, `ReadOnlyTextField`, `LimitedTextField`) |
| `NumberField` | `Field/NumberField.jsx` | Numeric input, optional `unit` adornment |
| `SelectField` | `Field/SelectField.jsx` | `react-select` dropdown, Tamanu-styled |
| `AutocompleteField` | `Field/AutocompleteField.jsx` | Searchable / async-suggester autocomplete |
| `MultiselectField` | `Field/MultiselectField.jsx` | Multi-value select |
| `DateField` / `TimeField` / `DateTimeField` | `Field/DateField.jsx` | Date / time / datetime inputs (timezone-aware) |
| `NullableBooleanField` | `Field/NullableBooleanField.jsx` | Yes / No / unknown |
| `CheckField` | `packages/web/app/components/Field/CheckField.jsx` | Checkbox + label *(lives in web, not ui-components)* |

## Default styling

```
/* input: */   border: 1px solid #dedede; border-radius: 3px; font: 14px Roboto; color: #444;
/* label: */   above the input (OuterLabelFieldWrapper); required ornament in #f76853;
/* helper: */  11px/1.4 #888;
/* error: */   border + helper/error text in #f76853 (alert);
/* disabled: */ background #f3f5f7, text #b8b8b8;
```

## Do / don't

- ✅ Always provide a translatable `label`.
- ✅ Choose the specific input (`DateField`, `NumberField`, …) over a plain
  `TextField` with manual parsing.
- ✅ Lay fields out with [FormGrid](./form-grid.md); let `Field` own label/error/helper.
- ❌ Don't show validation errors before a submit attempt.
- ❌ Don't hand-roll labels, asterisks, or error text around a bare input.
- ❌ For `placeholder` (which needs a plain string) use `getTranslation`, not a
  `TranslatedText` element.
