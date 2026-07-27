{% docs table__medication_dispenses %}
Records of medication dispensing events, tracking when medications from pharmacy orders are physically dispensed to patients. Each record represents a single dispensing event for a specific prescription within a pharmacy order.
{% enddocs %}

{% docs medication_dispenses__pharmacy_order_prescription_id %}
Reference to the [pharmacy_order_prescription](#!/source/source.tamanu.tamanu.pharmacy_order_prescriptions) that this dispense record fulfills. Links this dispensing event to the specific medication order being filled.
{% enddocs %}

{% docs medication_dispenses__quantity %}
The quantity of medication units dispensed to the patient in each dispensing.
{% enddocs %}

{% docs medication_dispenses__instructions %}
Additional instructions provided to the patient when dispensing the medication, such as dosage guidance, timing, storage requirements, or special considerations for administration.
{% enddocs %}

{% docs medication_dispenses__dispensed_by_user_id %}
Reference to the [user](#!/model/model.public.users) (typically a pharmacist or pharmacy staff member) who dispensed the medication.
{% enddocs %}

{% docs medication_dispenses__dispensed_at %}
The timestamp indicating when the medication was physically dispensed to the patient.
{% enddocs %}

{% docs medication_dispenses__medication_preset_label_id %}
Optional reference to a [reference_data](#!/source/source.tamanu.tamanu.reference_data) row of type `medicationPresetLabel` — a preset label whose translated text was used to populate this dispense's `instructions` value. Recorded so the dispense form can re-display the chosen preset when the dispense is re-opened. Null when no preset was selected.
{% enddocs %}

{% docs medication_dispenses__medication_id %}
Reference to the [reference_data](#!/source/source.tamanu.tamanu.reference_data) drug that was actually dispensed for this fill. Copied from the prescription at dispense time, or the substituted drug when the prescription was modified by pharmacy at dispensing. The original prescription is never altered by a dispensing modification.
{% enddocs %}

{% docs medication_dispenses__is_variable_dose %}
Whether this fill was dispensed as a variable dose (the amount decided at administration time rather than fixed). Copied from the prescription at dispense time, or pharmacy's modified value.
{% enddocs %}

{% docs medication_dispenses__dose_amount %}
The dose amount this fill was actually dispensed with. Copied from the prescription at dispense time, or pharmacy's modified value. Null for variable-dose fills.
{% enddocs %}

{% docs medication_dispenses__dosing_unit %}
The dosing unit for the dispensed dose amount (e.g. mg, tablet). Resolved from the dispensed drug's reference data at dispense time.
{% enddocs %}

{% docs medication_dispenses__dispensing_unit %}
The unit the medication is dispensed in (e.g. tablet, bottle), used with the dispensed quantity. Resolved from the dispensed drug's reference data at dispense time.
{% enddocs %}

{% docs medication_dispenses__frequency %}
The administration frequency this fill was dispensed with. Copied from the prescription at dispense time, or pharmacy's modified value.
{% enddocs %}

{% docs medication_dispenses__route %}
The route of administration this fill was dispensed with. Copied from the prescription at dispense time, or pharmacy's modified value.
{% enddocs %}

{% docs medication_dispenses__duration_value %}
The duration value this fill was dispensed with, paired with `duration_unit`. Copied from the prescription at dispense time, or pharmacy's modified value.
{% enddocs %}

{% docs medication_dispenses__duration_unit %}
The unit for `duration_value` (e.g. days, weeks). Copied from the prescription at dispense time, or pharmacy's modified value.
{% enddocs %}

{% docs medication_dispenses__pharmacy_notes %}
Pharmacy notes recorded for this fill. When the fill was modified by pharmacy, includes the standard modification note and is sent to the original prescriber as a notification.
{% enddocs %}

{% docs medication_dispenses__display_pharmacy_notes_in_mar %}
Whether this fill's pharmacy notes are displayed on the medication administration record. Always true for pharmacy-modified fills.
{% enddocs %}

{% docs medication_dispenses__modified_by_id %}
Reference to the [user](#!/model/model.public.users) who modified the prescription details for this fill at dispensing. Null when the fill was dispensed as prescribed.
{% enddocs %}

{% docs medication_dispenses__modified_reason_id %}
Reference to a [reference_data](#!/source/source.tamanu.tamanu.reference_data) row of type `medicationDispenseModifyReason` — the reason the prescription details were modified for this fill. Null when the fill was dispensed as prescribed.
{% enddocs %}

{% docs medication_dispenses__modified_at %}
When the prescription details were modified for this fill. A non-null value marks the dispense as modified by pharmacy; it drives the modified indicators in the dispensed medication tables and on the MAR. Null when the fill was dispensed as prescribed.
{% enddocs %}
