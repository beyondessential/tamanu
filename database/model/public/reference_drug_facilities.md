{% docs table__reference_drug_facilities %}
Tracks the availability status of drugs at specific facilities.

- Links reference drugs to facilities with their availability status
- Allows facilities to manage which drugs are available, unavailable, or have limited stock
- Used for medication dispensing workflows to determine drug availability at a facility
{% enddocs %}

{% docs reference_drug_facilities__reference_drug_id %}
Foreign key reference to the associated drug in the reference_drugs table
{% enddocs %}

{% docs reference_drug_facilities__facility_id %}
Foreign key reference to the facility where this drug availability applies
{% enddocs %}

{% docs reference_drug_facilities__quantity %}
The quantity of the drug at this facility (e.g., '0', '1', 'unavailable')
{% enddocs %}

{% docs reference_drug_facilities__stock_status %}
Computed column that indicates the stock availability status of the drug at this facility. Automatically derived from the quantity field with the following values:
- 'yes': Drug is in stock (numeric quantity > 0)
- 'no': Drug is out of stock (numeric quantity = 0 or empty)
- 'unavailable': Explicitly marked as unavailable
- 'unknown': Quantity is NULL or cannot be parsed as a number
This column is automatically recalculated whenever the quantity field is updated, making it efficient for filtering and sorting medication availability queries.
{% enddocs %}
