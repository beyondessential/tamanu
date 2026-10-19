# Plan

## Scope

This is a visual change to the tab scroll arrows on two tab bars: the encounter tabs and the patient-level tabs (Summary, Details, Results and so on). When the arrows appear stays as it is on both. Don't change it:

- Encounter tabs (`TabDisplayDraggable.jsx`) use MUI's `scrollButtons="auto"`, which shows an arrow only when there are tabs to scroll to in that direction
- Patient tabs (`TabDisplay` via `PatientView.jsx`) use `scrollButtons={true}`, which always renders both arrows and hides a disabled one
- Both hide the arrows on very narrow screens

## Arrow styling

Restyle the arrows following the mockup:

- A small square button with rounded corners (the design system's icon button radius) and an `outline` border, with a `white` fill, vertically centred in the tab bar
- A larger chevron in `primary`, at full opacity
- A `primary10` fill on hover
- A disabled arrow stays invisible and keeps its current footprint, so the tabs don't shift

## Where the styles go

Define the arrow styles once as a shared styled-components `css` block and apply it in both places, so the two tab bars can't drift apart:

- `TabDisplayDraggable.jsx`'s `TabContainer`, for the encounter tabs
- `PatientView.jsx`'s `StyledDisplayTabs`, for the patient tabs

`TabDisplay.jsx` is a generic component, and other screens use it for their own unrelated tab bars: the chart instance tabs inside an encounter's Charts tab (`ChartsPane.jsx`), the same on the program registry charts view, and several admin screens (settings, import/export, programs, program registries, roles, reports). Apply the styles at `StyledDisplayTabs` rather than in `TabDisplay`'s `TabContainer` so those other tab bars are untouched.

The patient tab bar is taller than the encounter one because its tabs carry icons, so check the arrow still sits vertically centred there.
