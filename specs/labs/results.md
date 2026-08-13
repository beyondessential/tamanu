---
id: LABR
---

# Lab results

How recorded lab test results are displayed, and when a result that falls outside its
reference range is flagged for clinicians.

## Out-of-range flagging

- [ ] A numeric result that falls outside its reference range is visually flagged wherever results are shown — both the patient's results table and an individual lab request's results table.
- [ ] The flag is a highlight on the result itself, consistent across both tables.
- [ ] The flag appears as soon as results are saved, regardless of the lab request's status.
- [ ] Results that are still being entered are not flagged; the flag appears only once results are saved.
- [ ] Hovering a flagged result shows that it is outside the normal range, naming the bound it breaches and the unit.
- [ ] Option/select (qualitative) results are not flagged.
- [ ] A result with no reference range defined is not flagged.

## Reference range resolution

- [ ] A test's effective reference range is resolved with this priority: a per-test numeric override (minimum and/or maximum), then a per-test text range, then the sex-based range on the test type, then the test type's text range.
- [ ] A per-test numeric override that sets only one bound is combined with the test type's default for the other bound.
- [ ] Sex-based ranges use the patient's recorded sex; where the patient's sex has no configured range, the numeric flag does not apply.
- [ ] The reference range displayed in the lab request results table and the out-of-range flag are derived from the same resolution, so they always agree.

## Displaying results in a lab request

- [ ] The lab request results table shows each test's result, unit, reference range, method, lab officer, verification and completed date.
- [ ] A result that also carries a secondary result shows the secondary result on hover.

## Edited results

- [ ] A result whose value has been changed after it was first entered is marked with a faded asterisk next to the result value, in both the patient's results table and an individual lab request's results table.
- [ ] Whether a result counts as edited is derived from its recorded change history: it is edited once its value has taken more than one distinct value.
- [ ] When a lab request's results table contains any edited result, a faded "* Edited entry" note appears at the bottom right below the table, in the same colour as the asterisk. The note is absent when no results are edited.
