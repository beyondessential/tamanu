{% docs table__medication_administration_records %}
Records of medication administrations to patients, tracking when medications prescribed in the system were given, not given, or otherwise administered.
{% enddocs %}

{% docs medication_administration_records__status %}
Status of the medication administration.

One of:
- `GIVEN` - The medication was administered to the patient
- `NOT_GIVEN` - The medication was not administered to the patient
{% enddocs %}

{% docs medication_administration_records__administered_at %}
The date and time when the medication was administered or marked as not given. This represents the actual time of administration, which may differ from the scheduled time.
{% enddocs %}

{% docs medication_administration_records__prescription_id %}
Reference to the [prescription](#!/source/source.tamanu.tamanu.prescriptions) that this administration record is associated with. Links this administration event to the specific medication order it fulfills.
{% enddocs %}
