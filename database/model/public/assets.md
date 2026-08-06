{% docs table__assets %}
Table of assets used in the tamanu app ui and patient letters.
{% enddocs %}

{% docs assets__id %}
Tamanu identifier for the asset.
{% enddocs %}

{% docs assets__name %}
Name of the asset set by the user on upload.
{% enddocs %}

{% docs assets__type %}
This is the type of asset stored.
{% enddocs %}

{% docs assets__data %}
Legacy inline copy of the uploaded image bytes. Null for assets stored on the blob store, which are addressed by hash instead.
{% enddocs %}

{% docs assets__facility_id %}
Reference to the [facilities](#!/source/source.tamanu.tamanu.facilities) this asset is associated with.
{% enddocs %}

{% docs assets__hash %}
Content hash of the asset's image in the blob store. Null for legacy assets whose bytes are still held inline in data.
{% enddocs %}
