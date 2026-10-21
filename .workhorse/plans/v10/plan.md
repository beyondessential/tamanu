# Primary diagnosis in the encounter header

## Primary diagnosis panel

- Diagnoses are ordered by certainty (Confirmed, then Suspected, then ED Diagnosis), and alphabetically by name within each certainty.
- The panel shows at most three lines of diagnoses. Whatever doesn't fit collapses into a "+N more" toggle at the end of the third line, which opens a dropdown listing the remaining diagnoses in the same order.
- How many fit depends on the panel's width and the names' lengths, so the cut-off is measured at render time rather than fixed at a count. The mockup fixes it at six because that is what fits at a typical desktop width.
