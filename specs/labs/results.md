---
id: LABR
---

# Lab results

How recorded lab test results are displayed, and when a result that falls outside its
reference range is flagged for clinicians.

## Out-of-range flagging

- [ ] A result that falls outside its reference range is visually flagged wherever results are shown — both the patient's results table and an individual lab request's results table.
- [ ] The flag is a highlight on the result itself, consistent across both tables.
- [ ] The flag appears as soon as results are saved, regardless of the lab request's status.
- [ ] Results that are still being entered are not flagged; the flag appears only once results are saved.
- [ ] Hovering a flagged result shows that it is outside the normal range, naming the bound it breaches and the unit.
- [ ] Whether a result is range-checked depends on the result itself, not on the result type configured for the test: a result that reads as a number is checked against a numeric range even where its test type is configured to record free text.
- [ ] A result that is only partly numeric, such as "12 colonies", is shown as entered and is not checked against a numeric range.
- [ ] A result on a test whose reference range is text rather than numeric is flagged when the result does not match that text.
- [ ] Option/select (qualitative) results are not flagged.
- [ ] A result with no reference range defined is not flagged.

## Reference range resolution

- [ ] A test's effective reference range is resolved with this priority: a per-test numeric override (minimum and/or maximum), then a per-test text range, then the sex-based range on the test type, then the test type's text range.
- [ ] A per-test numeric override that sets only one bound is combined with the test type's default for the other bound.
- [ ] Sex-based ranges use the patient's recorded sex; where the patient's sex has no configured range, the numeric flag does not apply.
- [ ] The reference range displayed in the lab request results table and the out-of-range flag are derived from the same resolution, so they always agree.

## Searching the patient's results

- [ ] The patient's results table is filtered by a Test category field and a Test or panel field, and the table shows once either field has a value.
- [ ] Test category is single-select and offers only categories the patient has published results in.
- [ ] Test or panel is a multi-select that suggests individual tests and panels together by name, listed the same way whichever kind they are.
- [ ] Test or panel suggests only tests the patient has published results for, and panels the patient has a published lab request ordered under. A panel is not suggested merely because it contains a test the patient has results for.
- [ ] With one test or panel picked, the field shows its name. With more than one, it shows how many are picked, such as "5 selected".
- [ ] The suggestions list stays open while items are picked, so several can be picked in a row, and closes when the user clicks away from the field.
- [ ] Picked items are ticked in the suggestions list, and picking a ticked item again removes it. Clearing the field removes every pick at once.
- [ ] There is no limit on how many tests and panels can be picked.
- [ ] The two fields are mutually exclusive: picking a test category clears any picked tests and panels, and picking a test or panel clears the test category.
- [ ] A picked test category lists the category's tests as a flat list, alphabetical by name, with no heading rows and no test category column.
- [ ] A picked panel shows every one of its tests the patient has results for, whether that test was ordered through the panel or on its own.
- [ ] Picked panels are listed first, alphabetically by name. Each panel is a shaded heading row with its tests indented beneath it, in the panel's configured order.
- [ ] Individually picked tests are listed after the panels, under a shaded "Individual tests" heading row, indented and alphabetical by name.
- [ ] The heading rows show however few items are picked: a single picked panel still sits under its heading, and individually picked tests still sit under "Individual tests" when no panel is picked.
- [ ] A test appears under every picked panel that contains it, and again under "Individual tests" when it is also picked on its own.
- [ ] The table lists each test with its unit and normal range, followed by one column per sample date.

## Displaying results in a lab request

- [ ] The lab request results table shows each test's result, unit, reference range, method, lab officer, verification and completed date.
- [ ] A result that also carries a secondary result shows the secondary result on hover.
- [ ] The lab request results table can be exported.

## Edited entries

- [ ] A value that has been changed after it was first entered is marked with a faded asterisk next to that value.
- [ ] Whether a value counts as edited is derived from its recorded change history: it is edited once it has taken more than one distinct value. First filling in a blank is not an edit.
- [ ] In an individual lab request's results table, every field that can be changed after entry carries this marker: the result, the method, the lab officer, the verification and the completed date.
- [ ] The result cell is marked when either the result or its secondary result has been edited, since the cell surfaces both.
- [ ] Fields that cannot be changed after entry — the test name, unit and reference range — are never marked.
- [ ] The patient's results table marks edited results the same way.
- [ ] When a lab request's results table contains any edited value, a faded "* Edited entry" note appears at the bottom right below the table, in the same colour as the asterisk. The note is absent when nothing in the table is edited.
