# Picking "(item not in list)" creates one record

## Automated

- [x] Typing a new name, ArrowDown, Enter creates the record once and selects it
- [x] Clicking the "(item not in list)" option creates the record once
- [x] Arrowing over the "(item not in list)" option onto an existing one and pressing Enter creates nothing and selects the existing option
- [x] Picking the option closes the suggestions at once, without waiting for the next search
- [x] Picking the same "(item not in list)" name again while its first creation is pending creates it once and selects the created record
- [x] Picking an existing option while an "(item not in list)" creation is pending keeps the existing option when the creation resolves

## Manual

- [ ] Allergies: type a new name, ArrowDown, Enter, Confirm; searching the name again shows one row
- [ ] Allergies: type a new name, click the "(item not in list)" row, Confirm; searching the name again shows one row
- [ ] Allergies: type a new name, ArrowDown onto "(item not in list)", ArrowUp, Escape; searching the name again shows no row
- [ ] Allergies on a slow connection: type a new name, ArrowDown, Enter, then clear and retype the name and pick it again before the first save finishes; searching the name again shows one row
- [ ] Arrowing through existing options and pressing Enter still selects the highlighted option
- [ ] Clicking an existing option closes the list straight away and fills the field
