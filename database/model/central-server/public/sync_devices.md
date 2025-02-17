{% docs table__sync_devices %}
Authorised devices that can sync with the central server.
{% enddocs %}

{% docs sync_devices__last_persisted_at_sync_tick %}
The last sync tick that was persisted to the device.

0 if the device has never synced. As devices are registered to this table at
the time of their first sync, this field is only ever 0 if the device is
currently ongoing its first sync.
{% enddocs %}

{% docs sync_devices__registered_by_id %}
The user that registered the device.

For devices that synced before Tamanu v2.25.0, this field will be set to the nil UUID,
`00000000-0000-0000-0000-000000000000`, which is the global "system user".
{% enddocs %}
