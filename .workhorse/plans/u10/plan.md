# Plan

## Scope

This is a visual change to the tab scroll arrows only. When the arrows appear stays as it is: MUI's `scrollButtons="auto"` in `TabDisplayDraggable.jsx` shows an arrow only when there are tabs to scroll to in that direction, and hides both arrows on very narrow screens. Don't change it.

## Arrow styling

Restyle the arrows in `TabDisplayDraggable.jsx`'s `TabContainer`, following the mockup:

- A small square button with rounded corners (the design system's icon button radius) and an `outline` border, with a `white` fill, vertically centred in the tab bar
- A larger chevron in `primary`, at full opacity
- A `primary10` fill on hover
- A disabled arrow stays invisible and keeps its current footprint, so the tabs don't shift
