# FSM Ward Price Scenario — Test Cases (TAM-6913)

Scenarios that verify the distinct-location-per-night rule layered on top of the bed fee. Pairs with `ward-price-scenario-plan.md`; builds on the 6900 bed-fee behaviour.

**Setup:** as for the bed fee, with a general ward and a private ward both configured as bed-fee products, and the overnight check time set.

- [ ] Patient placed in the general ward at 08:00, moved to the private ward at 17:00 the same day, still admitted at the 02:00 check → billed **1 night general + 1 night private** (two lines, qty 1 each)
- [ ] Patient stays in one location across a night → exactly **1** night for that location (no double-count)
- [ ] Multi-night stay with one same-day double-occupancy night → that night counts **each distinct location once**; other nights count normally
- [ ] A placeholder location occupied only transiently during the window → **excluded** from the night count
