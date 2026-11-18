# Survey calculations

Calculated questions and results are checked against the calculation vocabulary before they are worked out, and mathjs is on 15.2 across web, server and mobile.

## Calculation vocabulary

- [x] Arithmetic over question codes, brackets and rounding config give the same values as before (verifies spec: PROGRAMS)
- [x] Allowed functions (`round`, `min`, `max`, `sum`, `abs`), conditionals, comparisons, logical operators and `pi` calculate (verifies spec: PROGRAMS)
- [x] Assignments, function definitions, several statements, property access, object and array literals have no value (verifies spec: PROGRAMS)
- [x] Calls to functions outside the list (`evaluate`, `import`, `createUnit`) have no value (verifies spec: PROGRAMS)
- [x] Units and unit conversion (`5 cm`, `x cm to mm`) have no value (verifies spec: PROGRAMS)
- [x] A code that is not a question in the survey has no value (verifies spec: PROGRAMS)
- [ ] Mobile: the same allowed and refused calculations give the same results in `surveyCalculations.spec.ts` (verifies spec: PROGRAMS)

## Importing surveys

- [x] The importer accepts calculations within the vocabulary (verifies spec: PROGRAMS)
- [x] The importer rejects a calculation that does not parse or uses anything outside the vocabulary, naming the unsupported part (verifies spec: PROGRAMS)
- [ ] The calculation-validation spreadsheet still reports two invalid calculations of six in `programsImporter.test.js`

## mathjs upgrade

- [ ] Vitals survey on desktop: BMI and mean arterial pressure (`DBP + 1/3(SBP - DBP)`) calculate as before
- [ ] Mobile: a program survey with a calculated question and a result shows the calculated value while filling it in, and the submitted answer matches
- [ ] Facility server: editing an answer on a submitted survey response recalculates its dependent calculated answers
