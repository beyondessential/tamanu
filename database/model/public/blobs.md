{% docs table__blobs %}
The local blob registry: one row per content-addressed blob held in this
server's on-disk blob store, keyed by algorithm-tagged hash.

On the central server this is the authoritative record of which content exists
and its verification state. On a facility server it is a cache index: which
blobs are present locally and their local state. Local to each server — never
synchronised and never recorded to the change log.
{% enddocs %}

{% docs blobs__hash %}
The blob's algorithm-tagged content hash, e.g. `sha256:` followed by the
lowercase-hex digest. Uniquely identifies the blob's bytes and determines its
path in the on-disk store.
{% enddocs %}

{% docs blobs__size %}
Size of the blob's content in bytes.
{% enddocs %}

{% docs blobs__integrity_state %}
The blob's integrity state: `verified` when its content matched its hash at the
last check, `quarantined` when verification failed and the blob is retained for
investigation but never served.
{% enddocs %}
