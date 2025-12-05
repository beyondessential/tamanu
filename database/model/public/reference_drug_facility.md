{% docs table__reference_drug_facility %}
Tracks the availability status of drugs at specific facilities.

- Links reference drugs to facilities with their availability status
- Allows facilities to manage which drugs are available, unavailable, or have limited stock
- Used for medication dispensing workflows to determine drug availability at a facility
{% enddocs %}

{% docs reference_drug_facility__reference_drug_id %}
Foreign key reference to the associated drug in the reference_drugs table
{% enddocs %}

{% docs reference_drug_facility__facility_id %}
Foreign key reference to the facility where this drug availability applies
{% enddocs %}

{% docs reference_drug_facility__quantity %}
The quantity of the drug at this facility (e.g., '0', '1', 'unavailable')
{% enddocs %}
