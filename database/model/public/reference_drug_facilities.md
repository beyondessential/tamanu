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
The numeric quantity of the drug available at this facility. Stored as an INTEGER:
- Positive integer: Number of units available (e.g., 10, 50, 100)
- 0: Drug is out of stock
- NULL: Quantity is not tracked or unknown (used when stock_status is 'unknown' or 'unavailable')
{% enddocs %}

{% docs reference_drug_facilities__stock_status %}
Indicates the stock availability status of the drug at this facility. Stored as a STRING with the following valid values:
- 'in_stock': Drug is available (quantity > 0)
- 'out_of_stock': Drug is not available but tracked (quantity = 0)
- 'unavailable': Drug is not available at this facility (quantity IS NULL)
- 'unknown': Stock status is unknown or not tracked (quantity IS NULL)

This column is stored separately from quantity and is enforced by database constraints to maintain consistency:
- 'in_stock' requires quantity > 0
- 'out_of_stock' requires quantity = 0
- 'unknown' or 'unavailable' require quantity IS NULL
{% enddocs %}
