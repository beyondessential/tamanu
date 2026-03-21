{% docs table__sync_queued_devices %}
Devices waiting their turn to be synced.
{% enddocs %}

{% docs sync_queued_devices__last_seen_time %}
The last time the device has reached out to the syncing server.
{% enddocs %}

{% docs sync_queued_devices__last_synced_tick %}
The sync tick the device is currently at.
{% enddocs %}

{% docs sync_queued_devices__facility_id_legacy %}
[Deprecated] Reference to the [facility](#!/source/source.tamanu.tamanu.facilities) this device is associated with.
{% enddocs %}

{% docs sync_queued_devices__urgent %}
A way for a device to bump its priority in the queue.
{% enddocs %}

{% docs sync_queued_devices__facility_ids %}
Reference to the [facilities](#!/source/source.tamanu.tamanu.facilities) this device is associated with.
{% enddocs %}

{% docs sync_queued_devices__consecutive_failures %}
Number of this device’s most recent completed sync sessions that ended in error, counted from newest backward until a successful session. Used to order the queue so devices with fewer consecutive failures are chosen first.
{% enddocs %}
