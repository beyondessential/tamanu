# White gap below buttons when reason for modification unfilled

Verifies that submitting a modal with a validation error no longer scrolls the dialog paper
itself, which pushed the modal header out of view and exposed bare white paper below the
content.

The trigger is generic rather than medication-specific: any modal whose content is taller than
the viewport and contains a required field will scroll its paper when the form's
scroll-to-first-error runs, because visually hidden "Required" labels position against the paper
and so escape the content scroller.

## Modify prescription modal

- [ ] Opening Dispense medication, modifying a prescription, leaving "Reason for modification"
      empty and pressing Confirm shows the inline `*Required` error with no white gap below the
      Cancel/Confirm buttons
- [ ] The "Modify prescription" title and close button stay visible after that failed submit
- [ ] The errored field is scrolled into view within the modal's scrollable content
- [ ] Filling the reason and pressing Confirm applies the modification as before

## Modals generally

- [ ] A tall modal with a required field (e.g. new patient, encounter, lab request) keeps its
      header fixed and shows no gap when submitted with a required field empty
- [ ] A tall modal still scrolls its content with a single scrollbar, with no second scrollbar on
      the dialog itself
- [ ] Modals shorter than the viewport are unchanged: content sits directly below the header with
      no trailing space
- [ ] Custom close buttons that sit over the header (Medication set modal) stay in the header
