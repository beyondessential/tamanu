# Figma design → code — Tamanu

How to implement a Figma design on a UI card using the Figma MCP, mapping the
design onto Tamanu's existing components instead of generating fresh markup.

Companion rules — don't repeat them, follow them:
- @llm/project-rules/translations.md — wrapping visible copy
- @llm/project-rules/coding-rules.md — frontend conventions and antipatterns
- @llm/project-rules/important-project-rules.md — styling constants, preferences

## Why a code-side map

Figma Code Connect (which maps designs to real components inside Figma) needs an
Organization/Enterprise plan; the BES Figma team is on Professional, so it is
unavailable. This document is the code-side substitute: the Figma MCP gives us
the design, and the component map below tells us which Tamanu component each
piece of the design becomes.

## The workflow (per UI card)

1. **Get the frame.** UI cards carry a Figma frame URL with a `node-id` in the
   description (Workhorse `get_card`). Extract the `fileKey` and `nodeId` from
   the URL.
2. **Pull design context.** `get_design_context` returns a screenshot, reference
   structure, and tokens; `get_screenshot` for the visual; `get_variable_defs`
   for tokens. `get_design_context` requires the Figma design-to-code guidance to
   be loaded first (the `/figma-design-to-code` skill, or the
   `skill://figma/figma-design-to-code/SKILL.md` MCP resource).
3. **Translate, don't paste.** Figma emits React + Tailwind by default; Tamanu is
   styled-components + MUI + `@tamanu/ui-components`. Treat Figma's output as a
   spec of structure, spacing and tokens — map each element to a Tamanu component
   using the map below.
4. **Reconcile tokens.** Match `get_variable_defs` output against
   `packages/web/app/constants/styles.js` and `theme/theme.js`. Never hardcode
   hex values that already exist as tokens.
5. **Wrap copy.** All visible strings via `TranslatedText` / `TranslatedEnum` /
   `TranslatedReferenceData` (see translations.md).
6. **Verify.** Compare the built UI against `get_screenshot` before finishing.

## Component map (design pattern → Tamanu component)

Verified exports of `@tamanu/ui-components` unless marked **web-local**
(`packages/web/app/components` — confirm the exact import at use). When several
fit, prefer the more specific one.

### Buttons
| Design | Component |
| --- | --- |
| Primary / filled | `Button` (default `variant="contained"`) |
| Secondary / outlined | `OutlinedButton` |
| Grey outline | `GreyOutlinedButton` |
| Destructive | `DeleteButton` or `RedOutlinedButton` |
| Text / link-style | `TextButton` |
| Back | `BackButton` |
| Icon-only | `DefaultIconButton` |
| Segmented / toggle | `ToggleButton` |
| Submit / cancel in a form | `FormSubmitButton` / `FormCancelButton` |
| Row of buttons | `ButtonRow` |
| Gated by permission | `ButtonWithPermissionCheck` |
| Button semantics, non-button look | `styled(UnstyledHtmlButton)` |

### Form fields (the `Field` family)
| Design | Component |
| --- | --- |
| Text input | `TextField` |
| Number input | `NumberField` |
| Single select | `SelectField` |
| Multi-select | `MultiselectField` |
| Typeahead / autocomplete | `AutocompleteField` |
| Reference-data lookup | `Suggester` (feeds `AutocompleteField`) |
| Date / datetime | `DateField` |
| Yes / No / Unknown | `NullableBooleanField` |
| File upload | `FileChooserField` |
| Photo capture | `PhotoField` |
| Helper / instruction text | `InstructionField` |
| Label wrapper | `OuterLabelFieldWrapper` |
| Required marker | `RequiredOrnament` |
| Radio group | **web-local** `RadioField` |
| Search box | **web-local** `SearchField` |
| Toggle switch | **web-local** `SwitchField` |

Forms are Formik-based — build with `Form` / `Field` from ui-components.

### Containers & overlays
| Design | Component |
| --- | --- |
| Modal / dialog | `Modal`, `BaseModal`, or `Dialog` |
| Form inside a modal | **web-local** `FormModal` |
| Confirm action | **web-local** `ConfirmModal` |
| Cancel / discard | **web-local** `CancelModal` |
| Tooltip | `Tooltip` |

### Data display & feedback
| Design | Component |
| --- | --- |
| Table / data grid | **web-local** `DataFetchingTable` (`components/Table`) |
| Tag / chip | `Tag` |
| Status chip | `VisibilityStatusChip` |
| Alert / banner | `Alert` |
| Date / time value | `DateDisplay` |
| Patient name | `PatientNameDisplay` |
| Empty state | `ContentUnavailableView` |
| Toast | existing toast helper (react-toastify / `CustomToastContainer`) |

### Copy & icons
| Design | Component |
| --- | --- |
| Any visible text | `TranslatedText` |
| Enum label | `TranslatedEnum` |
| Reference-data name | `TranslatedReferenceData` |
| Icon | `@tamanu/ui-components` `Icons`, or `@mui/icons-material` |

## When the design has no obvious match

Search `@tamanu/ui-components` and `packages/web/app/components` before inventing
anything. If nothing fits, build a small purpose-built component rather than
bending a shared one (coding-rules.md), and add the new mapping to this file so
the map stays current.
