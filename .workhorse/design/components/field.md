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

## Sizes

Four sizes. Input and label text share a size within each.

| Size | Input height | Input and label text | Icon | Default vertical padding | Label–input gap |
|---|---|---|---|---|---|
| Large | 44px | 14px / 18px | 20px | 13px | 4px |
| Medium | 40px | 14px / 18px | 20px | 11px | 4px |
| Small | 36px | 14px / 18px | 16px | 10.5px | 4px |
| XSmall | 32px | 12px / 15px | 16px | 8.5px | 3px |

Width follows the layout ([FormGrid](./form-grid.md)); the Figma examples are 364px
wide (the Large search field 382px), which is not a minimum or maximum.

## Shape and spacing

```
border: 1px, inside the input's height (box-sizing: border-box);  border-radius: 3px;
padding-inline: 16px (some variants use 12px on the right);
mandatory marker: 2px after the label;
helper or validation text: 1–2px below the input;
```

## Typography and colours

| Element | Type | Colour |
|---|---|---|
| Input value | Roboto Regular, size by field | Super Dark 80 `#444444` |
| Placeholder | Roboto Regular, size by field | Light 20 `#B8B8B8` |
| Label | Roboto Medium, size by field | Dark 60 `#666666` |
| Helper and character-limit text | Roboto Regular, 11px / 15px (Small - Regular) | Mid 40 `#888888` |
| Validation message | Roboto Regular, 11px / 15px (Small - Regular) | Alert 100% `#F76853` |
| Mandatory marker (`*`) | Roboto Medium | Alert 100% `#F76853` |

## States

| State | Background | Border |
|---|---|---|
| Default, completed | White `#FFFFFF` | Box Outline `#DEDEDE` |
| Disabled, disabled completed | Background `#F3F5F7` | Box Outline `#DEDEDE` |
| Active dropdown (empty or completed) | White `#FFFFFF` | Tamanu Blue 60 `#326699` |
| Validation | White `#FFFFFF` | Alert 100% `#F76853` |

The Figma file names the disabled states "Deactive" and "Deactive completed".

## Variants

| Variant | Sizes | States | Notes |
|---|---|---|---|
| Standard | All four, labelled and unlabelled | All above | `TextField` |
| Search | All four | Default, disabled | Search icon at the start. `SearchField` |
| Tag | All four, labelled and unlabelled | Default, active dropdown | Selected values show as tags inside the input. `MultiselectField` |
| Counter / unit | Large labelled, Medium and Small unlabelled | Default, disabled | Unit sits at the end of the input. `NumberField` with `unit` |

Each field can show or hide its label, placeholder, value, helper text, validation
message, mandatory marker, help icon, right icon, clear control and dropdown
indicator. The Figma helper copy "Max 50 characters." is placeholder design copy, not
a character limit.

## Where the code differs

The implementation predates these sizes. Until it is brought in line:

- `StyledTextField` uses `padding-block: 13px` and 18px line height with no fixed
  height, which comes out at Large (44px). There are no Medium, Small or XSmall
  sizes; `size="small"` drops the text to 11px.
- Input text is 15px rather than 14px.
- Input padding is `15px` on the left and `12px` on the right rather than 16px.
- The label (`OuterLabelFieldWrapper`) uses a 16px line height, and 11px at
  `size="small"` rather than 12px.
- The mandatory marker sits `0.2em` (about 3px) after the label.
- Helper text (`MuiFormHelperText`) uses `line-height: 1.4` and a 4px gap above.
- The focused border is Tamanu Blue 60 on every field type, not only dropdowns, and
  a grey hover border (MUI `grey[400]`) has no Figma state.
- The placeholder darkens to Mid 40 on focus.
- The help icon is 16.25px in Mid 40.

## Do / don't

- ✅ Always provide a translatable `label`.
- ✅ Choose the specific input (`DateField`, `NumberField`, …) over a plain
  `TextField` with manual parsing.
- ✅ Lay fields out with [FormGrid](./form-grid.md); let `Field` own label/error/helper.
- ❌ Don't show validation errors before a submit attempt.
- ❌ Don't hand-roll labels, asterisks, or error text around a bare input.
- ❌ For `placeholder` (which needs a plain string) use `getTranslation`, not a
  `TranslatedText` element.
