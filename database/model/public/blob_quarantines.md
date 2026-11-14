{% docs table__blob_quarantines %}
Content the deployment has found to be malware, named by hash rather than by any
copy of it.

Written on the central server, whose antivirus verdict is authoritative, and
synchronised out to facilities and devices so they refuse the content whether or
not they can reach central. A row here stops the content being served, fetched,
or repaired anywhere, stands whether or not the server holds the bytes, and
still stands when a copy of the content arrives later.

Distinct from the `blobs` registry, which records what one server holds and
never leaves it.
{% enddocs %}

{% docs blob_quarantines__hash %}
The algorithm-tagged content hash of the quarantined content, e.g. `sha256:`
followed by the lowercase-hex digest. The identity of the record: the same
content is the same hash wherever it turns up.
{% enddocs %}

{% docs blob_quarantines__scanner_version %}
The version of the scanning engine that reached the infected verdict, kept for
the review a suspected false positive needs.
{% enddocs %}

{% docs blob_quarantines__signature_version %}
The scanner's malware signature version at the time of the verdict, kept for the
same reason as the scanner version: a verdict is only as good as the signatures
behind it.
{% enddocs %}
