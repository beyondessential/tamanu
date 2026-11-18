# Picking "(item not in list)" creates one record

## Automated

- [x] Typing a new name, ArrowDown, Enter creates the record once and selects it
- [x] Clicking the "(item not in list)" option creates the record once
- [x] Arrowing over the "(item not in list)" option onto an existing one and pressing Enter creates nothing and selects the existing option

## Manual

- [ ] Allergies: type a new name, ArrowDown, Enter, Confirm; searching the name again shows one row
- [ ] Allergies: type a new name, click the "(item not in list)" row, Confirm; searching the name again shows one row
- [ ] Allergies: type a new name, ArrowDown onto "(item not in list)", ArrowUp, Escape; searching the name again shows no row
- [ ] Arrowing through existing options and pressing Enter still selects the highlighted option
