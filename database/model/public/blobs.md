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
investigation but never served, `absent` when the store no longer holds the
bytes this entry names and the server needs to acquire them again.
{% enddocs %}

{% docs blobs__tier %}
Durability tier on a facility or mobile server: `outbox` while this server
holds the only durable copy, awaiting the central server's acknowledgement —
never evicted; `cache` once the content is durable on the central server —
evictable under the LRU size budget. Not consulted on the central server.
{% enddocs %}

{% docs blobs__last_accessed_at %}
When the blob's content was last read (or admitted, whichever is later), used
for least-recently-used eviction ordering on facility and mobile servers.
Recency updates may be coalesced, so this is a lower bound on the true last
access.
{% enddocs %}

{% docs blobs__last_scrubbed_at %}
When the scheduled integrity scrub last verified this blob's content against its
hash; the result of that verification is the integrity state as at this time.
The scrub takes the least-recently-scrubbed blobs first, so how far this lags
behind the present is how far behind a full cycle of the store the scrub is.
Null means never scrubbed.
{% enddocs %}

{% docs blobs__eligible_since_tick %}
The push cursor (last successful sync push tick) at the moment this outbox blob
was first observed eligible for push — its referencing record had synced.
Compared against the current push cursor to measure how long the blob has gone
unpushed while syncs kept succeeding: the outbox dysfunction signal. Null while
the blob is not yet eligible, and cleared when it is pushed and demoted to cache.
{% enddocs %}

{% docs blobs__has_parity %}
Whether a parity sidecar is stored alongside this blob's content, letting limited
corruption be repaired in place without another copy. Error correction is off by
default and enabled per server, and covers that server's durable copies above a
small size threshold: every blob on the central server, and un-pushed (outbox)
blobs on a facility. The scrub generates parity for a covered blob that has none,
so enabling error correction protects content already stored rather than only new
writes.
{% enddocs %}

{% docs blobs__correction_count %}
How many times this blob's content has been repaired from its parity. Each repair
is verified against the blob's hash before it is kept, so a correction means the
content was recovered intact rather than lost.
{% enddocs %}

{% docs blobs__last_corrected_at %}
When this blob's content was last repaired from its parity. Together with the
correction count this gives the rate of correction over a period, which is a
failing-media signal: a rising rate means the underlying storage is beginning to
fail and should be replaced, ahead of the point where it produces unrecoverable
loss.
{% enddocs %}
