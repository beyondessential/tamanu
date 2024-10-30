{% docs table__sync_lookup %}
Cache of records to use for sync.

This is used internally in the sync process.
{% enddocs %}

{% docs sync_lookup__record_id %}
The `id` field of the record.
{% enddocs %}

{% docs sync_lookup__record_type %}
The table name of the record.
{% enddocs %}

{% docs sync_lookup__data %}
All the fields of the record.
{% enddocs %}

{% docs sync_lookup__patient_id %}
If the record has a [patient](#!/source/source.tamanu.tamanu.patients) reference, this is it extracted here.

This is used to filter records efficiently during the sync process.
{% enddocs %}

{% docs sync_lookup__encounter_id %}
If the record has an [encounter](#!/source/source.tamanu.tamanu.encounters) reference, this is it extracted here.

This is used to filter records efficiently during the sync process.
{% enddocs %}

{% docs sync_lookup__facility_id %}
If the record has a [facility](#!/source/source.tamanu.tamanu.facilitys) reference, this is it extracted here.

This is used to filter records efficiently during the sync process.
{% enddocs %}

{% docs sync_lookup__is_lab_request %}
Whether the record is or is related to a lab request.

This is used to filter records efficiently during the sync process.
{% enddocs %}

{% docs sync_lookup__is_deleted %}
Whether the record is deleted (`deleted_at` is not null).

This is used to sort and filter records efficiently during the sync process.
{% enddocs %}

{% docs sync_lookup__updated_at_by_field_sum %}
If the record has an `updatedAtByField`, the sum of those values.

This is used to sort and filter records efficiently during the sync process.
{% enddocs %}

{% docs sync_lookup__pushed_by_device_id %}
The unique device that pushed this record.
{% enddocs %}
