# Edited entry indicator on lab request results

Scenarios verifying the faded asterisk and "* Edited entry" note on an individual lab request's results table.

## Cases

- [ ] A numeric result that has been edited after first entry shows a faded asterisk next to its value (verifies spec: LABR)
- [ ] An option/free-text result that has been edited shows the asterisk next to its value (verifies spec: LABR)
- [ ] A result entered once and never changed shows no asterisk (verifies spec: LABR)
- [ ] The "* Edited entry" note appears at the bottom right below the table when at least one result is edited (verifies spec: LABR)
- [ ] The note is absent when no results in the request are edited (verifies spec: LABR)
- [ ] The `labRequest/:id/tests` endpoint returns `isEdited: true` for a test whose result changed more than once, and `false` otherwise, for both panel and non-panel requests (verifies spec: LABR)
- [ ] The indicator agrees with the result history modal — a result shown with an asterisk also has a History section (verifies spec: LABR)
