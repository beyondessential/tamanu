{% docs table__location_groups %}
A group of locations managed as a single unit (e.g. a ward in hospital)
{% enddocs %}

{% docs location_groups__name %}
Full readable name for location group
{% enddocs %}

{% docs location_groups__code %}
Code for location group
{% enddocs %}

{% docs location_groups__facility_id %}
Reference to the [facility](#!/source/source.tamanu.tamanu.facilities) this location group is in.
{% enddocs %}

{% docs location_groups__is_bookable %}
Controls whether and where this location group appears in the booking calendar:  
- `all`: shown on both views  
- `weekly`: shown only on weekly view
- `daily`: shown only on daily view
- `no`: hidden from calendar (default)
{% enddocs %}
