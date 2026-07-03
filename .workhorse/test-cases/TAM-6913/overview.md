# Ward-price scenario — test cases (TAM-6913)

Scenarios that verify the distinct-location-per-night rule layered on top of the bed fee. Builds on the TAM-6900 bed-fee behaviour.

**Setup:** as for the bed fee, with a general ward and a private ward both configured as bed-fee products, and the overnight check time set.

- [ ] Place a patient in the general ward at 08:00, move to the private ward at 17:00 the same day, still admitted at the 02:00 check; confirm billed **1 night general + 1 night private** (two lines, qty 1 each) (verifies spec: FEES)
- [ ] Keep a patient in one location across a night; confirm exactly **1** night for that location (no double-count) (verifies spec: FEES)
- [ ] Run a multi-night stay with one same-day double-occupancy night; confirm that night counts **each distinct location once** while other nights count normally (verifies spec: FEES)
- [ ] Occupy a placeholder location only transiently during the window; confirm it is **excluded** from the night count (verifies spec: FEES)
