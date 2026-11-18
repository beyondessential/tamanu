# Patient portal form searches and responses

## Search questions

- [x] A diagnosis search on a portal form returns matching diagnoses (verifies spec: PPORT)
- [x] A portal request to add a reference data entry through the suggestion routes is refused and adds nothing (verifies spec: PPORT)
- [x] A drug search on a portal form leaves out drugs marked sensitive (verifies spec: PPORT)
- [x] A portal search without a sign-in is refused
- [ ] A drug question on a portal form still finds a non-sensitive drug and submits it as the answer

## Submitting a form

- [x] A submitted response is recorded for the signed-in patient even when the request names another patient (verifies spec: PPORT)
- [x] A submitted response's encounter takes the sending facility's default location and department, even when the request names another facility's (verifies spec: PPORT)
- [ ] A submitted response's actions (such as a program registration) use the facility that sent the form, even when the request names another facility (verifies spec: PPORT)
- [ ] Filling in and submitting a form on the portal still records the response and marks the form completed
