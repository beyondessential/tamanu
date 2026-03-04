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
