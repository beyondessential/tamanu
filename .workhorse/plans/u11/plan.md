# Encounter lab results printout

## Notes

- The "Lab results printout" setting (`features.labRequest.enableLabResultsPrintout`) gates the encounter printout as well as the single-request actions. Its admin description names only the print results button and interim report option, so reword it to cover printing an encounter's results too.
- Requests containing a sensitive test are left out of the encounter printout for every user, not only for users without the sensitive lab request permission. The encounter lab request list filters sensitive requests by permission, so the printout needs its own exclusion rather than relying on that filter.
