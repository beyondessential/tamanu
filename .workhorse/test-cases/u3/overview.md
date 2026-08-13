# Edited entry indicator on lab request results

Scenarios verifying the faded asterisk and "* Edited entry" note on an individual lab request's results table.

## Result column

- [ ] A numeric result that has been edited after first entry shows a faded asterisk next to its value (verifies spec: LABR)
- [ ] An option/free-text result that has been edited shows the asterisk next to its value (verifies spec: LABR)
- [ ] A result entered once and never changed shows no asterisk (verifies spec: LABR)
- [ ] A result left blank and then filled in for the first time shows no asterisk (verifies spec: LABR)
- [ ] Editing only the secondary result marks the result cell (verifies spec: LABR)

## Other editable columns

- [ ] An edited method shows the asterisk in the Method column (verifies spec: LABR)
- [ ] An edited verification shows the asterisk in the Verification column (verifies spec: LABR)
- [ ] An edited completed date shows the asterisk in the Completed column (verifies spec: LABR)
- [ ] A lab officer that has changed across edits shows the asterisk in the Lab officer column (verifies spec: LABR)
- [ ] The Test, Units and Reference columns never show an asterisk (verifies spec: LABR)
- [ ] Editing one field marks only that column, leaving the others unmarked (verifies spec: LABR)

## Legend

- [ ] The "* Edited entry" note appears at the bottom right below the table when any value in it is edited (verifies spec: LABR)
- [ ] The note is absent when nothing in the request is edited (verifies spec: LABR)
- [ ] The note appears when the only edited field is one other than the result (verifies spec: LABR)

## Endpoint

- [ ] `labRequest/:id/tests` returns `editedFields` naming each changed field, and an empty array for an untouched test, for both panel and non-panel requests (verifies spec: LABR)
- [ ] The indicator agrees with the result history modal — a result shown with an asterisk also has a History section (verifies spec: LABR)
