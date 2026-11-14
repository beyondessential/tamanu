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
A binary version of image data uploaded by the user, for assets that predate
content-addressed blob storage and have not yet been moved onto the filesystem.
Empty once the row carries a hash.
{% enddocs %}

{% docs assets__hash %}
The algorithm-tagged hash of the image's contents, naming the blob that holds the
bytes in the [blob store](#!/source/source.tamanu.tamanu.blobs).
{% enddocs %}

{% docs assets__facility_id %}
Reference to the [facilities](#!/source/source.tamanu.tamanu.facilities) this asset is associated with.
{% enddocs %}
