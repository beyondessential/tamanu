# AI form builder previews checked against save validation

## Automated (central-server `__tests__/admin/formBuilder.test.js`)

- [x] A preview that would save comes back as generated, with no extra model call and no survey left in the program (verifies spec: PROGRAMS)
- [x] A generated preview with a PatientData question on an unsupported column is sent back to the model as a tweak naming the question by its code, and the corrected preview and the model's correction message are returned (verifies spec: PROGRAMS)
- [x] A tweaked preview is checked the same way, and the corrected reply is what the session history keeps (verifies spec: PROGRAMS)
- [x] When corrections run out, the reply names the problems still left (verifies spec: PROGRAMS)
- [x] When a correction cannot be applied, the reply names the problems (verifies spec: PROGRAMS)
- [x] An async chat checks its preview the same way, and the polled result carries the corrected preview and message (verifies spec: PROGRAMS)
- [x] A rejected question is named by the code the model gave it, including for problems the data element checks report (verifies spec: PROGRAMS)
- [x] The corrected reply is what the chat history keeps for a generated preview
- [x] Prompt markers in quoted problems are stripped before they reach the model
- [x] A fault while checking leaves the preview as generated, and keeps any correction already made
- [x] A chat naming a program that does not exist, or a programId that isn't a string, is refused and its upload deleted

## Manual

- [ ] In Admin > Programs > AI form builder, ask for a form with a hospital number question. The preview never offers a PatientData question on a column that cannot be saved, and the reply says how the question was changed
- [ ] Select Save to database on that preview. The form saves into the selected program
- [ ] Ask for a form with a question reading a program registration field into a program with no registry. The reply says what was changed or names the problem before saving
