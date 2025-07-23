{% docs table__facilities %}
Table of facilities.

Facilities may be either or both of:

- Any healthcare facility, like hospitals, clinics, mobile vaccination vans, laboratories, etc
- A Tamanu Facility deployment.

When syncing, patient and related records are scoped to a facility, according to the
[`patient_facilities`](#!/source/source.tamanu.tamanu.patient_facilities) table.
{% enddocs %}

{% docs facilities__code %}
Code (identifier) for the facility.
{% enddocs %}

{% docs facilities__name %}
Full readable name.
{% enddocs %}

{% docs facilities__division %}
Administrative division this facility lives in.
{% enddocs %}

{% docs facilities__type %}
Type of the facility.
{% enddocs %}

{% docs facilities__email %}
Administrative email address of the facility.
{% enddocs %}

{% docs facilities__contact_number %}
Administrative contact number of the facility.
{% enddocs %}

{% docs facilities__city_town %}
City or town of the facility.
{% enddocs %}

{% docs facilities__street_address %}
Street address of the facility.
{% enddocs %}

{% docs facilities__catchment_id %}
Catchment area ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs facilities__is_sensitive %}
If set to `true`, encounters created on this facility will only be viewable when logged into this facility
{% enddocs %}
