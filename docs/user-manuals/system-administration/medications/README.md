# 15. Medications

Prescribing, the medication administration record, medication sets, and sensitive medications.

These guides step system administrators through the set up of the Tamanu Medications Module. If it is
your first time implementing the Medications Module or digitising medication workflows in your clinical
setting, read the Medications Module Implementation Guide first.

| # | Guide | Covers |
| --- | --- | --- |
| 15.1 | [Reference data](reference-data.md) | Drug, medication sets, not given reasons, and the hard coded values those columns accept |
| 15.2 | [Settings](settings.md) | Pharmacy orders, frequencies, administration schedules, and the automated workflows they drive |
| 15.3 | [Permissions](permissions.md) | Prescribing, administration, pharmacy notes, and sensitive medication access |

> [!WARNING]
> The Medications Module is not recommended for the following medications or clinical settings, whose
> orders and administration should remain on paper:
>
> - IV infusion medications
> - Anaesthesia medications
> - Complex oncology protocols
> - Dialysis
> - ICU, PICU and NICU

---

## Vaccines

All vaccines that appear in the Vaccine Schedule, or are selected when recording vaccine workflows, must
also be listed in the `Drug` reference data. See the [Immunisations](../immunisations/) configuration
guides.

---

## IV medications

IV infusions should remain on paper, however standard IV medications can be prescribed and their
administration recorded in Tamanu. The distinction is set out below.

### IV medications

IV medications are intermittent intravenous drugs given as bolus doses or short-term infusions,
typically over minutes to a few hours at predetermined intervals, and prescribed with standard dosing
parameters such as milligrams, units or millilitres.

They are administered either as IV push, given directly into the IV line over seconds to minutes, or as
piggyback infusions, mixed in small volume bags of 50 to 250mL and infused over 30 minutes to 2 hours.

Examples:

- Ceftriaxone 1g IV every 24 hours
- Furosemide 40mg IV push twice daily
- Morphine 2 to 4mg IV push every 4 hours as needed for pain

These follow standard pharmacy preparation protocols and can be administered using basic IV techniques,
without specialised infusion devices or rate calculations.

### IV infusions

IV infusions are continuous intravenous therapies requiring precise rate control. They are measured in
units per time, such as mcg/min, units/hour or mg/hour, rather than total dose amounts. They require
infusion pumps for accurate delivery and often need frequent titration based on patient response and
clinical parameters.

Examples:

- Norepinephrine starting at 0.1 mcg/kg/min, titrated to maintain MAP >65 mmHg
- Insulin infusion beginning at 0.1 units/kg/hour with glucose-based adjustments
- Heparin drip initiated at 18 units/kg/hour with PTT-guided titration

IV infusions require specialised nursing protocols and continuous monitoring, and often a critical care
setting, due to their potent effects and the need for rapid dose adjustment based on real-time
assessment.

Their documentation requirements are also more complex. An infusion record must capture multiple
time-stamped data points including initial rates, all rate changes with clinical rationales, cumulative
dosing calculations, concentration calculations and detailed patient response parameters. It must also
integrate monitoring parameters, linking blood glucose to insulin adjustments, PTT values to heparin
changes, or haemodynamic measurements to vasopressor titrations, and support double-verification
workflows, pump programming validation and detailed handover communications.
