# Discharge modal header and stepper

Both fixes are visual and sit in shared components, so the checks are a mix of confirming the
discharge modal looks right and confirming the modals and forms either side of it are untouched.

## Discharge modal

- [ ] Open the discharge modal on an inpatient encounter: no bar appears between the header border and the first field.
- [ ] Nothing in the strip under the header reacts to hover or to a click.
- [ ] The header is the same height as a modal with a corner close button (open any other modal beside it to compare).
- [ ] The modal's close icon sits wholly inside the header, vertically centred, and in the same place as another modal's close button.
- [ ] Leave the form with edits in hand: the unsaved-changes screen's close icon sits in that same place.

## Other users of the shared components

- [ ] The death form still shows its two-step stepper, and stepping between the screens still moves the active segment.
- [ ] A modal that takes the standard corner close button is unchanged in header height and close-button position.
- [ ] The markdown editor modal in admin settings has a full-height header rather than a collapsed one.
