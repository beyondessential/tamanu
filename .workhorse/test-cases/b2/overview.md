# Content-addressed blob storage: test cases

Scenarios for the B2 epic, covering all thirteen cards. Attachment and asset bytes
move out of the database onto a content-addressed filesystem store, so the epic
touches every read and write path for binary content on three hosts, plus the
transfer, integrity, backfill and operational machinery underneath.

Coverage splits by how much real machinery each guarantee needs. Ordering and
policy decisions (admission sequence, the fetch and push state machines, eviction
choice, push eligibility, the free-disk floor, serve policy, parity geometry) live
in `@tamanu/blobs` and `@tamanu/utils` behind narrow ports, and are covered by fast
tests with every IO faked. Filesystem-shaped guarantees (atomic placement, staging
resume, ranged reads, sidecars) need a real store root and run against temp
directories with an in-memory registry. Anything that depends on a registry, on
scoping, or on the difference between central and a facility runs against a real
database. One suite deliberately spans hosts: the shared host contract runs the
same cases against Postgres on a server and SQLite on a device, so a registry or
hashing divergence fails on whichever host diverged rather than surfacing later as
content one side cannot resolve.

Two features are off unless a deployment turns them on, so every antivirus and
error-correction scenario establishes which side of that switch it runs on. The
integrity scrub is always on and needs no such qualifier.

Sections below follow the spec areas. Some scenarios appear under more than one
area where they genuinely serve both, most often attachment serving, which is a
consumer guarantee and a serving guarantee at once.

---

# Content addressing, transfer, capacity, serving, access control

## Pure decision logic (in-memory fakes, no filesystem or database)

### Blob identity and layout

- [x] A digest is tagged with its algorithm and lowercased on the way in, so the same content never yields two spellings of one hash (verifies spec: CAS)
- [x] An untagged digest, an uppercase digest, an unknown algorithm, a truncated digest and non-hex characters are each rejected rather than becoming a file path (verifies spec: CAS)
- [x] A hash resolves to the algorithm name, a two-level fan-out of the first two bytes of the digest, and the remainder as the filename (verifies spec: CAS)

### Admission ordering

- [x] Content is hashed, placed at its fan-out path, and only then registered, so the recorded hash is computed from the bytes actually on disk rather than from one a caller supplied (verifies spec: CAS)
- [x] A failure between placement and registration leaves the bytes with no registry row, and the next admission of the same content adopts them instead of re-placing them (verifies spec: CAS)
- [x] Content whose hash is already stored is not written again, the temporary file is removed, and the live registry row keeps its tier (verifies spec: CAS)
- [x] Staged content is verified against the hash it was offered under before admission, and staging that hashes to something else is discarded so the next attempt starts clean (verifies spec: CAS, XFER)
- [x] Committing a hash the store already holds is a no-op that drops the staging (verifies spec: XFER)
- [x] Committing with nothing staged reports nothing staged rather than hashing a missing file (verifies spec: XFER)

### Free-disk floor

- [x] Admission proceeds while free space on the volume stays above the reserve with the new bytes accounted for (verifies spec: CAP)
- [x] Admission is refused rather than taking free space into the reserve (verifies spec: CAP)
- [x] The store asks its host to free at least the shortfall before refusing, and proceeds when that frees enough (verifies spec: CAP)
- [x] An eviction that does not free enough still ends in a refusal rather than a partial admission (verifies spec: CAP)
- [x] An admission refused for capacity is refused before the content is hashed or placed, so nothing is written on the way to the refusal (verifies spec: CAP)

### Fetch

- [x] A fetch starts at offset zero and commits once the source reports the total (verifies spec: XFER)
- [x] A fetch resumes from the bytes already staged rather than restarting from zero (verifies spec: XFER)
- [x] Staged bytes that already cover the known total commit with no further request, which is what an interruption between the last byte and the commit leaves behind (verifies spec: XFER)
- [x] Content already held skips the transfer entirely (verifies spec: XFER)
- [x] A body that ends early without erroring is resumed from the new staged size, paced by the same backoff an error gets (verifies spec: XFER)
- [x] An attempt that delivers new bytes resets the stalled run, so a slow link keeps making progress instead of reaching the give-up limit (verifies spec: XFER)
- [x] A run of attempts that deliver nothing ends the fetch, with the backoff growing per consecutive stall (verifies spec: XFER)
- [x] A not-found from the source is terminal rather than retried, since content the source does not hold is pending at its origin and is not a transfer fault (verifies spec: XFER)
- [x] The total size of ranged content is taken from `content-range`, or from `content-length` relative to the requested offset, and is absent when neither header is present (verifies spec: XFER)

### Push

- [x] An offer answered as already-stored acknowledges without moving any bytes (verifies spec: XFER)
- [x] A push starts from the count of bytes the receiver reports it has already staged (verifies spec: XFER)
- [x] Content is delivered in bounded chunks rather than as one whole-blob body (verifies spec: XFER)
- [x] A chunk that fails is followed by a re-offer, and delivery resumes from the position the receiver reports (verifies spec: XFER)
- [x] A zero-byte blob completes with a single empty delivery (verifies spec: XFER)
- [x] Delivering every byte without an acknowledgement is an error, so an acknowledgement is the only completion signal (verifies spec: XFER)
- [x] Pushing content not held locally is refused (verifies spec: XFER)
- [x] A hash mismatch reported by the receiver ends the push rather than retrying it (verifies spec: XFER)
- [x] A refusal from the receiver ends the push immediately, since a retry with no sync in between cannot change the answer (verifies spec: XFER, BLAC)

### Availability and inline encoding

- [x] Bytes held locally report available with their size, bytes only the source holds report awaiting fetch, and bytes neither side holds report awaiting upload, so the two content-pending cases are distinguishable without a further request (verifies spec: XFER)
- [x] Content within the inline limit is returned base64-encoded, content at exactly the limit is still encoded, and content past it is refused without the blob ever being opened (verifies spec: SERVE)

## Shared host contract (real registry on each host: Postgres on a server, SQLite on a device)

- [x] Known content hashes to its known sha256 digest on both hosts, so a host that hashes differently fails here rather than storing content under an identity the other cannot resolve (verifies spec: CAS)
- [x] Empty content has a defined hash on both hosts (verifies spec: CAS)
- [x] Re-admitting content that is already registered leaves the live row entirely alone, tier and recency included (verifies spec: CAS, CACHE)
- [x] Re-admitting content whose row was soft-deleted resurrects it with the incoming tier and its recency reset to now, rather than leaving a tombstone that shadows the hash forever (verifies spec: CAS)
- [x] Five concurrent admissions of the same content leave exactly one registry row (verifies spec: CAS)
- [x] Delete removes the row outright, so the same hash can be admitted again afterwards (verifies spec: CAS)
- [x] Placement into the fan-out path leaves the content whole at its new path, the source gone, and the placed bytes still hashing to their name (verifies spec: CAS)
- [x] Staging accumulates appended parts and reports the size a resume starts from, and discarding it returns that size to zero (verifies spec: XFER)
- [x] A recency refresh inside the coalescing window is a no-op, and one outside it applies, so hot content does not rewrite the registry on every read (verifies spec: CACHE)

## Real filesystem, fake registry

### Storage and identity

- [x] Content is stored under `sha256/<first byte>/<second byte>/<rest>` beneath the store root and reads back byte for byte (verifies spec: CAS)
- [x] Admission records the blob's size and a verified integrity state (verifies spec: CAS)
- [x] Empty content is stored, reported present, and served like any other blob (verifies spec: CAS)
- [x] Four concurrent puts of identical content admit it exactly once, while distinct content stays distinct (verifies spec: CAS)
- [x] A source stream that fails partway leaves no temporary file behind (verifies spec: CAS)
- [x] Bytes on disk with no registry row are a crash orphan: never served, and adopted by the next admission of the same content (verifies spec: CAS)
- [x] Presence, retrieval, staging and deletion each reject a malformed hash rather than reporting the blob absent (verifies spec: CAS)
- [x] Deleting removes both the file and the registry row, and deleting a blob that is not held is a no-op (verifies spec: CAS)
- [x] A registry row whose bytes have gone stats as null, so a row alone is not content (verifies spec: CAS)
- [x] The store walk finds every hash whose bytes are on disk whether or not the registry names them, and skips the staging and temp directories, which are not content (verifies spec: CAS)

### Free-disk floor

- [x] A put is refused before the source is consumed when a declared size hint already breaches the reserve (verifies spec: CAP)
- [x] A put refused for capacity destroys the source, writes no registry row, and leaves the temp directory empty (verifies spec: CAP)
- [x] Cache is evicted before a refusal, and the admission proceeds when eviction frees enough (verifies spec: CAP)
- [x] Staging a transfer is refused on the same floor as a put (verifies spec: CAP, XFER)

### Staging and resume

- [x] Appends accumulate into one staging file and commit as a stored blob (verifies spec: XFER)
- [x] Staging survives the store object being rebuilt, so a transfer resumes after a restart from the bytes already on disk (verifies spec: XFER)
- [x] An append whose declared offset does not match the bytes already staged is rejected, leaving the staged bytes as they were (verifies spec: XFER)
- [x] Commit verifies the complete staged file, including bytes delivered before an interruption, and a mismatch discards it so a retry starts clean (verifies spec: XFER)
- [x] Concurrent appends for one hash are serialised: the first completes in full and the second fails its offset check rather than interleaving into the file (verifies spec: XFER)
- [x] An append that would exceed the declared remaining bytes stops before writing the overrun and discards the whole staging (verifies spec: XFER)
- [x] A zero-byte staging commits as the empty blob (verifies spec: XFER)

### Ranges

- [x] A read bounded at one or both ends streams only those bytes, inclusive of both ends, rather than reading the whole file and slicing it (verifies spec: SERVE)

### Facility to central channel

- [x] The channel refuses to construct without the server's facility ids, so the misconfiguration surfaces at boot rather than as a forbidden response on the first transfer (verifies spec: BLAC)
- [x] A push delivers a blob in chunks and reports the acknowledgement only once the receiver has verified and stored it (verifies spec: XFER)
- [x] A connection cut partway through every chunk still completes the push, resuming each time from the count central reports (verifies spec: XFER)
- [x] Local bytes that no longer hash to their name surface as a mismatch without retrying, and central is left without the content (verifies spec: XFER)
- [x] An offer refused by central fails the push after that one call, with no resume loop (verifies spec: BLAC)
- [x] A delivery refused mid-transfer fails after the one refused call, without a re-offer, and central holds nothing (verifies spec: BLAC)
- [x] A fetch downloads, verifies and stores central's content, and a fetch for content already held costs no central call at all (verifies spec: XFER)
- [x] A fetch whose stream keeps dropping resumes from the staged bytes until the whole blob has arrived (verifies spec: XFER)
- [x] A fetch for content central does not hold surfaces as content-pending rather than as a transfer failure (verifies spec: XFER)
- [x] Bytes staged in full before an interruption commit on the next call with only an availability probe and no byte transfer (verifies spec: XFER)
- [x] A read serves local bytes directly, fetches from central on a miss and then serves, and honours a requested range (verifies spec: XFER, SERVE)

## Real database

- [x] The outbox status reports how many un-pushed blobs the server holds, the space they occupy, and the oldest push cursor at which any of them became eligible, with cache blobs excluded from all three (verifies spec: CAP)
- [x] The eligibility marker is stamped once, at the push cursor when the blob first became eligible, and later cycles leave it alone, so the measure counts sync cycles since eligibility rather than wall-clock time (verifies spec: CAP)
- [x] A synchronised record referencing a hash the server holds no bytes for is reported once past the delivery grace, while a reference still within that grace stays ordinary content-pending (verifies spec: XFER)
- [x] A hash with several references is reported once, references to deleted records are excluded, the batch is bounded to a limit, and the longest-undelivered come first so a backlog past the limit reports the same worst cases every pass (verifies spec: XFER)

## HTTP routes (real app, database and blob store)

### Channel authentication

- [x] Every channel operation (availability probe, fetch, offer, content delivery) is refused without authentication (verifies spec: BLAC)
- [x] An authenticated web user carrying no device is refused, so the store is not reachable as a content-addressed endpoint by an end user (verifies spec: BLAC)
- [x] An authenticated device without the sync-client scope is refused on every operation (verifies spec: BLAC)
- [x] A sync-client request that declares no facilities is refused, so the channel never falls back on the user's whole entitlement (verifies spec: BLAC)
- [x] A request declaring a facility the user cannot access is refused (verifies spec: BLAC)

### Availability, fetch and push

- [x] A hash central does not hold reports awaiting upload and never awaiting fetch, since central is authoritative and never fetches (verifies spec: XFER)
- [x] Held content streams with the hash as the entity tag, its byte length, and an accept-ranges header (verifies spec: SERVE)
- [x] An open-ended range serves the remainder with a content-range naming the total, which is how an interrupted fetch resumes; a closed range serves exactly those bytes; a range starting past the end is refused with 416 (verifies spec: SERVE, XFER)
- [x] An offered blob is accepted in offset-addressed chunks, each reporting the bytes received, with the acknowledgement withheld until the whole content has verified and been registered (verifies spec: XFER)
- [x] A re-offer between chunks reports the bytes already staged, so an interrupted push resumes from there (verifies spec: XFER)
- [x] Delivered content that does not hash to the offered hash is refused and the staging discarded, so the next offer starts from zero (verifies spec: XFER)
- [x] Content overrunning the declared total is refused and the whole staging discarded (verifies spec: XFER)

### Reference scoping

- [x] A blob referenced by a record within the declared facility scope is served (verifies spec: BLAC)
- [x] A hash outside the requester's scope answers identically, body for body, to a hash central has never seen, on both the probe and the fetch (verifies spec: BLAC)
- [x] A reference pinned to a sensitive facility is invisible to a server that does not declare it and available to one that does (verifies spec: BLAC)
- [x] One in-scope reference suffices for a hash that has several references (verifies spec: BLAC)
- [x] A hash central holds but no record references is absent for every requester (verifies spec: BLAC)
- [x] The scope is the declared facility set and not the user's entitlement: a device entitled to every facility that declares only its own does not see a blob referenced elsewhere (verifies spec: BLAC)
- [x] An offer for an unreferenced hash is refused, as is one for a hash referenced only outside the offering server's scope (verifies spec: BLAC)
- [x] An unexpected offer is refused identically whether or not central holds the content, so the refusal discloses nothing about the central store (verifies spec: BLAC)
- [x] Content delivered for an unexpected hash is refused with none of it staged, and a resumed segment is refused once the referencing record has gone, so the check covers every segment and not only the first (verifies spec: BLAC)
- [x] A push refused before its record has synchronised succeeds once the record is there, which is the sync-first ordering end to end (verifies spec: BLAC, XFER)

---

# Facility and mobile cache, reclamation, mobile

## Eviction and outbox policy (pure computation, fake host)

- [x] Cache blobs are removed least-recently-used first until the cache fits its size budget, and eviction stops as soon as the excess is freed (verifies spec: CACHE)
- [x] The single most-recently-used cache blob is withheld from budget eviction, so a blob larger than the whole budget serves reads instead of cycling through eviction and refetch (verifies spec: CACHE)
- [x] A budget that is not a finite number is treated as unusable and evicts nothing, rather than reading as "evict everything" (verifies spec: CACHE)
- [x] A blob whose deletion fails is skipped and the pass continues with the next candidate (verifies spec: CACHE)
- [x] A blob with a read in progress is not removed, and a blob held by two concurrent reads stays until the last of them releases it (verifies spec: CACHE)
- [x] Eviction driven by the free-disk floor protects no most-recently-used blob, unlike budget enforcement, because the floor is the hard bound and the budget is a target (verifies spec: CACHE, CAP)
- [x] Eligible outbox blobs are offered oldest-first, and a blob whose referencing record has not synchronised is never offered (verifies spec: CACHE)
- [x] A blob whose transfer is already in flight is not offered again by an overlapping pass, so the same content is never uploaded twice concurrently (verifies spec: CACHE)
- [x] A push that throws does not block the blobs behind it: the pass continues and the failure is counted (verifies spec: CACHE)
- [x] Only an acknowledged push demotes the blob to cache; one that returns unacknowledged stays in the outbox, and one acknowledged whose demotion failed is re-offered and re-demoted next pass (verifies spec: CACHE)
- [x] One consumer's failing reference resolver does not starve the other consumers' blobs of eligibility, and with none registered nothing is eligible (verifies spec: CACHE)
- [x] Content already stored keeps the tier it already has when the same bytes are admitted again, so cache stays cache (verifies spec: CACHE)

## Device storage budget (pure computation)

- [x] A larger-capacity device derives a larger cache budget than a small one, so no single configured figure is needed across a fleet (verifies spec: CACHE, MOB)
- [x] The budget shrinks as the device's free space falls, counting the current cache as reclaimable, so a device filling with unrelated data gives cache space back (verifies spec: CACHE, MOB)
- [x] The budget never derives negative on a device already past its reserve (verifies spec: CACHE, MOB)
- [x] The device's free-disk reserve scales with its capacity, clamped up on small devices and down on large ones (verifies spec: MOB, CAP)

## Facility (real Postgres, real filesystem)

### Tiers and read-through

- [x] Locally originated content is admitted at the outbox tier, and content already held as cache stays cache when the same bytes are admitted as outbox (verifies spec: CACHE)
- [x] An acknowledged blob is demoted to cache and its push-eligibility marker cleared (verifies spec: CACHE)
- [x] A read of content held locally serves the stored bytes and refreshes stale recency, while one inside the coalescing window leaves recency unchanged (verifies spec: CACHE)
- [x] A read of content the server has dropped fetches it from central, admits it as cache, and serves it, so the cache is genuinely disposable (verifies spec: CACHE)
- [x] A read of content held neither locally nor reachable reports not-found rather than hanging (verifies spec: CACHE)

### Eviction

- [x] Once over budget, the least-recently-used cache blobs go first and the more recent ones survive (verifies spec: CACHE)
- [x] A lone cache blob larger than the entire budget is not evicted merely to satisfy the budget (verifies spec: CACHE)
- [x] Outbox blobs are left untouched while cache blobs around them are evicted, so content not yet durable on central is never reclaimed (verifies spec: CACHE, RECL)
- [x] A blob with a read in progress survives the pass and is evicted only once that read has completed and closed (verifies spec: CACHE)
- [x] Free-disk-floor pressure evicts even the sole most-recently-used blob, which budget enforcement would have protected (verifies spec: CACHE, CAP)
- [x] A changed budget applies on the next enforcement pass, with no restart (verifies spec: CACHE)

### Background pusher

- [x] Only blobs whose referencing record has synchronised to central are offered, oldest-first by admission time (verifies spec: CACHE)
- [x] A refused push leaves that blob in the outbox while the blob behind it still pushes and demotes (verifies spec: CACHE)
- [x] A second pass starting while a transfer is in flight starts no second transfer for the same blob (verifies spec: CACHE)
- [x] A referencing record counts as synchronised when it carries a real sync tick at or below the push cursor, or when it arrived from another server; the sync-tick flag values do not qualify (verifies spec: CACHE)
- [x] Before the first successful push completes, only records that arrived from elsewhere are treated as synchronised (verifies spec: CACHE)

## Device (SQLite registry, fake filesystem)

### Capture

- [x] Captured content is admitted at the outbox tier with no transfer channel wired at all, so capture does not depend on reaching the central server (verifies spec: MOB, CACHE)
- [x] Admission moves the source file into the store and leaves nothing at the source path, so the device keeps no second copy outside the store (verifies spec: MOB)
- [x] The same bytes captured twice resolve to one stored blob and keep the tier already recorded (verifies spec: MOB, CACHE)
- [x] A capture is refused with an error naming the device's storage when free space is already below the device's reserve, and cache is evicted before that refusal (verifies spec: MOB, CAP)

### Reads, tiers and reconciliation

- [x] Content the device holds is read from the store without touching the transfer channel (verifies spec: MOB)
- [x] Content the device does not hold is fetched by hash and admitted, and a second read of the same content triggers no further fetch (verifies spec: MOB)
- [x] A fetch for content the central server does not hold either raises a distinct awaiting-upload error rather than a generic not-found (verifies spec: MOB)
- [x] An acknowledged blob moves from the outbox to the cache tier, and under a squeezed budget the least-recently-used cache blob is evicted while the outbox blob is left alone (verifies spec: CACHE, MOB, RECL)
- [x] An outbox blob that no live attachment record references is demoted to cache, where the budget can reclaim it, since it could never become eligible for push (verifies spec: CACHE, MOB)
- [x] A pre-blob-store attachment whose record has not yet been pushed is adopted into the outbox and handed its hash, so it re-syncs hash-backed (verifies spec: MOB)
- [x] A pre-blob-store attachment whose record has already been pushed is adopted as evictable cache with its hash set and its sync tick untouched (verifies spec: MOB)
- [x] A pre-blob-store attachment whose file is gone loses its pointer and presents as awaiting content (verifies spec: MOB)
- [x] One legacy row that cannot be adopted is left for a later start without stalling the rest of the pass (verifies spec: MOB)

---

# Attachments and assets

## Pure functions

- [x] An asset or attachment row carrying a hash and no bytes passes both the facility and the central sanitiser with its data left null, so a hash-form row is not stranded at ingest (verifies spec: ASSET, ATCH)
- [x] A legacy row's bytes still decode from the Postgres hex form, from raw bytes, and from base64 (verifies spec: ASSET)
- [x] No asset row resolves to no image, and the blob store is never consulted (verifies spec: ASSET)
- [x] A legacy row's inline bytes are read without touching the blob store, while a hash row is resolved by opening the store and a multi-chunk stream is concatenated whole (verifies spec: ASSET)
- [x] A blob store failure propagates rather than resolving to no image, so the caller can present content-pending instead of an unbranded document (verifies spec: ASSET)
- [x] A response carrying content, including zero-byte content, produces no unavailable message in the web client (verifies spec: ATCH)
- [x] Awaiting upload, awaiting fetch and awaiting scan all resolve to one awaiting-content message, while content withheld as infected gets its own (verifies spec: ATCH, AV)
- [x] An unrecognised availability state falls back to the pending message, and every non-available state has some message, so a 202 never renders as an empty file (verifies spec: ATCH)

## Writing (real database and HTTP routes)

- [x] An upload over the configured maximum is rejected before anything is admitted, leaving no blob in the outbox and no attachment row (verifies spec: ATCH)
- [x] An accepted upload admits the file to the outbox and creates an attachment carrying the hash, the type and the caller-supplied patient scope, with no inline bytes (verifies spec: ATCH)
- [x] The attachment's recorded size is the size of the bytes actually admitted, not the caller's declaration (verifies spec: ATCH)
- [x] Patient and encounter scope supplied in a request body is ignored on central, so a caller cannot scope an attachment to an arbitrary patient (verifies spec: ATCH)
- [x] An upload the store refuses for lack of free disk is rejected with an insufficient-storage error (verifies spec: ATCH, CAP)
- [x] A photo answer admits its image at the outbox tier and records only the hash and admitted size, and copies the patient linkage on even when given only an encounter (verifies spec: ATCH)
- [x] An answer already holding an attachment id is left as it is rather than re-admitted (verifies spec: ATCH)
- [x] Creating a patient letter stores the rendered PDF as a blob-backed attachment scoped to the patient (verifies spec: ATCH)
- [x] A diagnostic report posted with a PDF lands the bytes in the central store and records the hash, scoped to the lab request's encounter and that encounter's patient (verifies spec: ATCH)
- [x] Blanking a photo answer re-admits its attachment as empty hash-backed content of size zero rather than reverting to an in-database row (verifies spec: ATCH)
- [x] A new asset admits the image to the central store and records the hash on a row with no bytes, reading back byte-identical (verifies spec: ASSET)
- [x] Replacing an asset re-points the row at a new hash, and replacing a legacy in-database asset converts it to hash form and drops the inline copy (verifies spec: ASSET)
- [x] Two assets uploaded with identical bytes share one hash and one stored blob (verifies spec: ASSET)
- [x] Asset upload and replacement are refused without the matching permission, and an invalid name, unrecognised extension or empty data are each rejected (verifies spec: ASSET)

## Reading (HTTP routes)

- [x] A hash-backed attachment is streamed from the central store, carrying the hash as its entity tag and advertising range support (verifies spec: ATCH, SERVE)
- [x] A requested byte range returns exactly that range, and an unsatisfiable range is refused with the content's extent (verifies spec: ATCH, SERVE)
- [x] Content can be requested base64-encoded, and content past the inline limit is refused that way while the same attachment still streams (verifies spec: ATCH, SERVE)
- [x] A legacy attachment holding its bytes in the row serves those bytes, as a buffer or base64 (verifies spec: ATCH)
- [x] A hash-backed attachment whose bytes central does not hold answers as an existing file awaiting upload from its origin (verifies spec: ATCH)
- [x] Reading an attachment that does not exist is refused as a permission failure, so absence is not disclosed (verifies spec: ATCH, BLAC)
- [x] An attachment missing on a facility is resolved from central and served, and the fetched bytes are retained so a second read needs no central call (verifies spec: ATCH, XFER)
- [x] A profile picture held locally is returned base64-encoded, one missing locally is resolved from central, and one neither server holds answers as awaiting content (verifies spec: ATCH)
- [x] A legacy profile picture central cannot supply answers as awaiting content, rather than a success carrying nothing (verifies spec: ATCH)
- [x] A patient with no profile picture at all is a client error, distinct from a picture awaiting its content (verifies spec: ATCH)
- [x] A hash-form asset resolves through the blob cache and returns its bytes inline, a legacy row returns its bytes through the same endpoint, and a hash row whose bytes are absent returns the content-pending state (verifies spec: ASSET)
- [x] An asset that was never uploaded returns an empty response, distinguishable from the content-pending one (verifies spec: ASSET)

## Sync scope (real database)

- [x] A hash-carrying attachment gets a sync lookup entry scoped to its own patient and not another's, and the synchronised payload carries the hash and no bytes (verifies spec: ATCH)
- [x] A legacy attachment holding its bytes in the row never enters the lookup, through an incremental pass and a full rebuild alike, so it cannot reach a facility (verifies spec: ATCH)

## Facility asset availability

- [x] The prefetch asks only for rows carrying a hash, scoped to this server's own facilities plus the deployment-wide assets, and fetches once per distinct hash (verifies spec: ASSET)
- [x] A hash central does not hold yet is skipped and the remaining assets are still fetched (verifies spec: ASSET)
- [x] A transport failure abandons the pass rather than putting every remaining asset through the same retry ladder (verifies spec: ASSET)
- [x] The cache budget is enforced once after new content is admitted, and a budget failure never fails the pass (verifies spec: ASSET, CACHE)
- [x] With no transfer channel the pass does nothing at all, not even querying for assets (verifies spec: ASSET)
- [x] A patient letter and both certificate types render when the deployment has no asset rows, so the artwork is an optional element (verifies spec: ASSET)

## Browser (Playwright)

- [x] A document uploaded through the documents tab appears in the table with its name, owner and department (verifies spec: ATCH)
- [x] An uploaded document previews with its first PDF page rendered and a download action offered, proving the bytes made the round trip through the store rather than a hash pointing at nothing (verifies spec: ATCH)
- [x] Three documents uploaded from the same file leave three separate rows and the newest still renders its content, so deduplicated blobs do not collapse rows onto one another (verifies spec: ATCH)

---

# Backfill

## Moving a row (real Postgres, real filesystem)

- [x] An attachment's bytes are admitted to the store and the row swaps to carrying the content hash with its byte column cleared, and an asset moves the same way (verifies spec: BKFL)
- [x] Two rows holding identical content converge on one hash and a single registry entry, so the store does not grow by duplicate copies (verifies spec: BKFL)
- [x] Zero-byte content moves like any other rather than being skipped as absent, and multi-megabyte content moves byte for byte (verifies spec: BKFL)
- [x] A run stops at the batch size and the next run continues with what is left, until a run finds nothing (verifies spec: BKFL)
- [x] A row already carrying a hash is never picked up again, so a repeat pass and a reference created after the upgrade both cost nothing (verifies spec: BKFL)
- [x] A row hard-deleted between the batch scan and its content read is skipped and the rest of the batch still moves, rather than the run dying (verifies spec: BKFL)
- [x] A run that died after admitting content but before updating the row completes on the next pass, storing no second copy (verifies spec: BKFL)
- [x] Moving a row writes no changelog entry of its own, leaving only the entry the original insert wrote (verifies spec: BKFL)
- [x] An admission that would cross the free-disk reserve fails the run with the row still holding its bytes, so the database is never emptied into a store that could not take it (verifies spec: BKFL, CAP)

## Facility seeding and changelog

- [x] Seeding admits the local asset content but leaves the rows holding their bytes, since central owns the row update (verifies spec: BKFL)
- [x] Seeded content is stored under the same hash central will send, so the updated row finds its blob already present (verifies spec: BKFL)
- [x] Seeding pages by offset rather than by consuming rows, so a pass over a set that does not shrink still terminates (verifies spec: BKFL)
- [x] A legacy entry's inline bytes are replaced by the content hash in its row snapshot, and the content is readable from the store afterwards (verifies spec: BKFL)
- [x] Content that survives only in the changelog (an asset superseded by a later upload) is admitted before the entry gives up its bytes, so nothing is discarded (verifies spec: BKFL)
- [x] A second pass over already-rewritten entries rewrites nothing, and entries for tables that never held blob content are left untouched (verifies spec: BKFL)

## Progress, completion and rollback

- [x] The remaining count spans both reference tables and the changelog, and reaches zero once every row and entry has moved (verifies spec: BKFL)
- [x] With everything moved, no hash referenced by a row or a changelog entry is unbacked by content the server holds (verifies spec: BKFL)
- [x] A hash whose content has since left the store is named, so completion is never reported on the absence of in-database bytes alone (verifies spec: BKFL)
- [x] A moved row's bytes are read back out of the store into the byte column and the hash dropped in the same update, so the row is never observable carrying both or neither (verifies spec: BKFL)
- [x] A row left carrying both a hash and stale bytes by an interrupted rollback is restored from the store rather than skipped (verifies spec: BKFL)
- [x] A rewritten changelog entry's byte snapshot is restored in the hex form Postgres renders a bytea into, and its hash cleared (verifies spec: BKFL)
- [x] A backfill stopped half way rolls back to a database where no row carries a hash, the rows it never reached included (verifies spec: BKFL)
- [x] Content with embedded nulls, high bytes and backslashes round-trips unchanged through a backfill and a rollback (verifies spec: BKFL)

## The scheduled job

- [x] One run drains both reference tables and the changelog on a central server, working through more rows than one batch holds (verifies spec: BKFL)
- [x] A run started after an earlier pass was cut short finishes the remainder, deriving its work from the data rather than a stored cursor (verifies spec: BKFL)
- [x] A deployment that never held legacy content reports an empty queue and its run does nothing (verifies spec: BKFL)
- [x] Content is admitted through the server's own store, the one carrying the facility's cache-eviction hook, rather than a store the job constructs for itself (verifies spec: BKFL)
- [x] Reaching the free-disk reserve pauses the job instead of failing it, leaving the row holding its bytes for a later run (verifies spec: BKFL, CAP)
- [x] On a facility, asset content is seeded into the local store while the rows are left for central's synced update, and no attachment content reaches the local store from either the rows or their changelog entries (verifies spec: BKFL)

## Both forms coexisting

- [x] A central attachment whose row still holds bytes is served from the database column, and one carrying a hash is served from the blob store in the same `{ data }` shape (verifies spec: BKFL)
- [x] A role without read permission is refused an attachment whose row still holds bytes, and a role with it succeeds (verifies spec: BKFL, BLAC)
- [x] A facility asset whose row still holds bytes is returned unchanged, while a hash-carrying row resolves through the blob cache to the same inline shape (verifies spec: BKFL)
- [x] A facility asset carrying a hash whose bytes are not held locally reads as content-pending rather than as an error (verifies spec: BKFL)
- [x] A backfilled attachment enters the sync lookup carrying its hash and no bytes (verifies spec: BKFL)

---

# Integrity, antivirus, error correction

## Codec, coverage and layout (pure computation)

- [x] Shards are cluster-aligned so one bad cluster damages exactly one shard (verifies spec: FEC)
- [x] Reaches 32+3 shards at the default proportion from 1 MiB up, and a large blob splits into groups rather than growing its shards past 1 MiB (verifies spec: FEC)
- [x] Data shards spread evenly across groups, so the last group is not a runt carrying a full group's parity (verifies spec: FEC)
- [x] Sidecar overhead stays within a small margin of the configured proportion at every size above the floor (verifies spec: FEC)
- [x] The parity shard count scales with the proportion, and a proportion rounding to nothing still buys one shard (verifies spec: FEC)
- [x] Central covers every blob it holds; a facility covers only its outbox; blobs below the size floor are skipped whatever their tier (verifies spec: FEC)
- [x] A single damaged shard, damage exactly at the parity budget, a contiguous run within it, and damage spanning data and parity shards are each recovered byte for byte (verifies spec: FEC)
- [x] A blob whose parity alone is damaged is left whole, and damage beyond the budget fails cleanly rather than emitting bytes (verifies spec: FEC)
- [x] Regenerating parity over intact content reproduces it byte for byte (verifies spec: FEC)
- [x] Damage located wrongly decodes "successfully" and emits bytes that are not the blob (verifies spec: FEC)
- [x] A group filling every shard slot, a last group holding an unfilled slot, and a short final shard are each recovered without padding leaking into the blob (verifies spec: FEC)
- [x] A sidecar path does not read back as a blob hash, so the scrub's store walk reads it as parity rather than as a stray blob (verifies spec: FEC, SCRUB)
- [x] The header round-trips the geometry it was written with, bytes that are not a sidecar are rejected, and a header carrying an impossible geometry is rejected rather than sizing a read from a bit-rotted group count (verifies spec: FEC)

The mislocation case is what justifies the unconditional hash check on the repair
path. It asserts the codec emits wrong bytes, because that is the behaviour the
hash check exists to catch: the codec cannot detect it.

## Serve policy (pure computation)

- [x] With the policy off, unscanned, clean and infected content are all served, so verdicts are recorded without being acted on (verifies spec: AV)
- [x] A quarantine still withholds content under the off posture, since it is the deployment's record rather than one server's reading (verifies spec: AV)
- [x] Serve-unless-known-bad serves not-yet-scanned content and withholds an infected verdict (verifies spec: AV)
- [x] A hash quarantined elsewhere is withheld on a server that never scanned it (verifies spec: AV)
- [x] Serve-only-when-known-good serves content with a clean verdict, withholds not-yet-scanned content as awaiting its check, and withholds infected content as infected rather than as pending (verifies spec: AV)
- [x] A server that drives no scanner falls back to serve-unless-known-bad, so it serves on central's records rather than withholding everything it holds, while still honouring a quarantine (verifies spec: AV)

## Verification and parity (real filesystem, fake registry)

- [x] A whole-blob read whose stored bytes no longer match the hash fails rather than serving them, and the corruption is reported to the healer (verifies spec: SCRUB)
- [x] A ranged read is not verified, since part of a blob cannot match a hash of the whole (verifies spec: SCRUB)
- [x] Verification reports what corrupt bytes actually hash to, and reports bytes the store does not hold as unheld rather than throwing (verifies spec: SCRUB)
- [x] A batch stamp of verified blobs never overwrites a row that went corrupt mid-pass, so known-bad bytes stay unserved (verifies spec: SCRUB)
- [x] Any integrity state other than verified is withheld from serving, so a state added later is not served by omission (verifies spec: SCRUB)
- [x] A covered blob gets a sidecar and its registry row records that it has one, whether admitted by put or by transfer (verifies spec: FEC)
- [x] A blob below the size floor gets none, nothing is written while error correction is off, and a facility covers an outbox blob and not a cache one (verifies spec: FEC)
- [x] An admission is refused when the blob plus its parity would cross the free-disk reserve, where the blob alone would fit (verifies spec: FEC, CAP)
- [x] A parity write that cannot fit leaves the blob stored unprotected rather than failing the admission (verifies spec: FEC)
- [x] A single damaged shard is repaired in place, the blob recorded verified and the correction counted against it (verifies spec: FEC)
- [x] Damage beyond the budget leaves the blob's bytes as they were and records no correction (verifies spec: FEC)
- [x] A reconstruction that does not match the blob's hash is discarded, and it is the hash check that rejects it (verifies spec: FEC)
- [x] No temporary files are left behind, repaired or not (verifies spec: FEC)
- [x] A covered blob with no sidecar has one regenerated, and a blob that has rotted since its last scrub is left unprotected so parity never encodes corruption (verifies spec: FEC)
- [x] Parity dies with its blob on delete, and is discarded on demotion out of the outbox (verifies spec: FEC)

## Scrub and scan passes (real filesystem, fake registry)

- [x] Stored blobs are verified against their hash and the time of it recorded, a whole batch stamped in one write (verifies spec: SCRUB)
- [x] Content whose bytes no longer match is reported corrupt, and a registry entry whose bytes are gone is reported missing (verifies spec: SCRUB)
- [x] The registry row is handed to the healer, so it can grade the fault on tier (verifies spec: SCRUB)
- [x] An already-corrupt blob is not re-reported each pass; an absent one is re-checked without re-escalation and re-stamped so it yields its slot (verifies spec: SCRUB)
- [x] An absent blob returns to verified once its bytes are back on disk (verifies spec: SCRUB)
- [x] Least-recently-scrubbed blobs are taken first, never-scrubbed ones ahead of stale ones, and the pass stops on its byte budget (verifies spec: SCRUB)
- [x] Bytes on disk that no registry entry names are verified against the hash their location encodes and registered with their size, and mismatches are recorded corrupt rather than adopted (verifies spec: SCRUB)
- [x] Reconciliation stops on the blob limit, leaving the rest to be found next pass rather than losing coverage (verifies spec: SCRUB)
- [x] Content that must be durably present but is not held at all is reported as a fault, and the pass is skipped where the server supplies no reference check (verifies spec: SCRUB)
- [x] A store that predates error correction is brought under protection once it is switched on, and a second pass has nothing left to protect (verifies spec: FEC)
- [x] A covered blob sitting behind a pass limit's worth of uncovered ones is still reached (verifies spec: FEC)
- [x] Content is admitted unscanned and its verdict recorded afterwards, with the scanner and signature versions that produced it (verifies spec: AV)
- [x] An infected hash is handed to the server to quarantine, and a pass that cannot write the quarantine record records no verdict either, so the blob is found again next pass (verifies spec: AV)
- [x] A blob already scanned under the current signatures is left alone, a clean blob is re-scanned once signatures move on, and an infected verdict is terminal (verifies spec: AV)
- [x] Content over the configured size cap is left unscanned rather than sent, and does not take the head of the queue away from the rest (verifies spec: AV)
- [x] A scanner that becomes unreachable mid-pass ends the pass with the remaining content unscanned and nothing refused, and one unreachable at all skips the pass entirely (verifies spec: AV)
- [x] Corrupt content is not scanned, since it has no servable bytes to hold a verdict about (verifies spec: AV, SCRUB)
- [x] Content is re-chunked to the daemon's stream limit whatever size the source reads produce, and a FOUND reply is read as an infected verdict (verifies spec: AV)

## Heal ladder per server (real database)

### Facility

- [x] A corrupt cache blob is dropped so the next read refetches it, and the drop is counted in local system facts since dropping the row is what makes it indistinguishable from an eviction (verifies spec: SCRUB)
- [x] A corrupt outbox blob is recorded corrupt and its bytes retained, rather than the only copy being dropped (verifies spec: SCRUB)
- [x] An outbox blob whose bytes are gone is recorded absent (verifies spec: SCRUB)
- [x] A corrupt outbox blob is repaired from central where central turns out to hold it, and becomes a cache replica; it stays corrupt when central cannot supply it (verifies spec: SCRUB)
- [x] A corrupt orphan is recorded corrupt and retained, rather than the cache path deleting the evidence (verifies spec: SCRUB)
- [x] A quarantined cache blob is left unrepaired rather than dropped and refetched, since a refetch is exactly resurrecting known-bad content (verifies spec: AV, SCRUB)
- [x] With error correction on, a corrupt outbox blob is repaired in place and the correction counted; damage beyond the budget is recorded corrupt; a cache blob is still left to refetch (verifies spec: FEC)
- [x] The retrofit spends no disk protecting content quarantined as malware (verifies spec: AV, FEC)
- [x] Bytes left on disk by an admission interrupted before registration are registered by the scheduled scrub (verifies spec: SCRUB)
- [x] The per-pass bounds the scheduled scrub reads resolve from settings (verifies spec: SCRUB)

### Central

- [x] Coverage is not narrowed by tier, since every copy central holds is durable (verifies spec: FEC)
- [x] A corrupt blob is repaired from parity rather than recorded corrupt, and the correction counted; damage beyond the budget and a blob carrying no parity are recorded corrupt (verifies spec: FEC)
- [x] A synchronised reference past the delivery grace whose bytes central does not hold is reported, while one still within the grace is left as content-pending (verifies spec: SCRUB)
- [x] A hash is reported once however many references point at it, and references to deleted records are excluded (verifies spec: SCRUB)
- [x] An undeliverable reference is registered absent, which records the fault where the state model can see it and stops it being re-found every pass (verifies spec: SCRUB)
- [x] Content recorded absent stays unservable until its bytes actually arrive, and the commit settles the state and size the placeholder row lacked (verifies spec: SCRUB)

## Serve and transfer decisions (real database, HTTP routes)

- [x] A corrupt blob is presented as awaiting content, without disclosing that it is corrupt (verifies spec: SCRUB)
- [x] A quarantined blob is presented as withheld rather than as pending, on the availability probe and the fetch alike (verifies spec: AV)
- [x] A quarantined hash is not wanted, so its bytes are never fetched again, and bytes pushed for one are acknowledged without being staged (verifies spec: AV)
- [x] A verifying copy of quarantined content arriving by push leaves the quarantine standing (verifies spec: AV)
- [x] Under serve-only-when-known-good, unscanned content is withheld as awaiting its scan and serves once a clean verdict is recorded, on both the transfer channel and the attachment route (verifies spec: AV)
- [x] A quarantined attachment the facility already holds is withheld without central being consulted, so it applies while the facility is offline (verifies spec: AV)
- [x] Under serve-only-when-known-good, content the facility does not yet hold is resolved from central rather than withheld, so it is not kept from ever being fetched or scanned (verifies spec: AV)
- [x] Central's awaiting-scan and withheld-infected answers are forwarded distinctly rather than collapsed into one (verifies spec: AV)
- [x] A corrupt local copy is not advertised as available, is not pushed or offered, and is replaced by a fetch rather than the read failing against it (verifies spec: SCRUB)

## Device (real SQLite)

- [x] Cache content verified within the recency interval is served without re-hashing, while outbox content, which the device alone holds, is re-hashed on every read (verifies spec: SCRUB)
- [x] Corrupt outbox content is recorded corrupt and surfaced on the device rather than refetched, and corrupt cache content is dropped and refetched (verifies spec: SCRUB)
- [x] An outbox blob is verified before it is offered for push, so corruption does not present as a repeatedly refused push (verifies spec: SCRUB)
- [x] Staged content that does not hash to the requested hash is rejected rather than admitted, and good bytes arriving for a row recorded corrupt clear the corrupt state (verifies spec: SCRUB)
- [x] A quarantined hash is refused from serving though its bytes verify, on a device that runs no scanner of its own (verifies spec: AV)

---

# Needs a fix

Found while auditing. Each is a divergence from a spec bullet rather than a
missing test, so a test alone would not close it.

- [ ] **Legacy and hash-backed attachments do not serve the same way.** BKFL says the two forms are indistinguishable to the requester, response shape included. The hash path goes through `serveBlob` and sets an entity tag and `accept-ranges` and honours `Range`; the legacy path in `packages/central-server/app/attachment.js` sets only content-type and content-length and ignores `Range`. During the backfill window, caching and ranged reads change per row depending on whether that row has moved yet (verifies spec: BKFL, SERVE)
- [ ] **A client that already holds a blob refetches it anyway.** SERVE says a response carries its hash as a strong validator and may be cached indefinitely, so a client holding the content does not fetch it again. `serveBlob` sets the etag but no `cache-control`, and pipes the body straight to the response rather than going through Express's freshness check, so an `If-None-Match` repeat is answered with the full body (verifies spec: SERVE)
- [x] **Central orphan collection does not exist, and is now recorded as deferred.** RECL's facility half (evict under an LRU size budget, never evict the outbox) is implemented and covered above. The central half has no implementation and no card ever claimed it. An implementation was written and withdrawn: review found that an age-based safety window cannot cover content deduplicated onto after a long gap, so a pass could hard-delete the bytes of an attachment whose reference was committing at that moment, unrecoverably and on the authoritative copy. `reclamation.md` now states the deferral and both traps whatever implements it has to answer (verifies spec: RECL)
- [x] **Backfill progress is readable by an operator.** The figures existed only as log lines. The query cookbook's "Backfill progress" subsection now carries three diagnose-class queries derived from `BlobBackfill.countRemaining()` and the sum `BlobBackfillTask.countQueue()` latches completion on (verifies spec: BKFL)
- [x] **A downgrade halts before it can drop a hash column, and the rollback is documented.** Each migration runs in its own transaction, so restoring `NOT NULL` on a `data` column fails and rolls that migration back whole. The asset migration used to leave `data` nullable instead, so it committed a dropped `hash` against null bytes and stranded the content; it now matches attachments. `runbooks/blob-backfill-rollback.md` covers the ordering (verifies spec: BKFL)

---

# Not automated

Everything that no test can reach. Each needs a human on real hardware, a real
deployment, or real data, and each says why in one line.

## The upgrade

- [ ] **The upgrade itself.** Nothing in CI runs the epic's migrations against a database already holding legacy attachment and asset rows and then boots the server. The sequence (migrate, boot, the job starts, it works through real content) exists only on a real deployment (verifies spec: BKFL)
- [ ] **Volume and duration.** Hundreds of gigabytes, the pace holding while clinical load is on the same database, the store growing before the database gives space back, and the total wall-clock time. CI can assert the batching shape but cannot reproduce contention (verifies spec: BKFL)
- [ ] **Bounded memory at volume.** Peak memory through a long run over large rows is only observable on a real run; a CI assertion on process memory would be flaky and prove nothing about a 100GB store (verifies spec: BKFL)
- [ ] **Whether an operator can tell if it is stuck.** Judging the adequacy of the progress figures mid-upgrade needs a person watching a real one (verifies spec: BKFL)
- [ ] **Rollback in anger.** Running the subcommand against a populated database with the store intact, then downgrading. The mechanism is unit-testable; the duration and the decision path are not (verifies spec: BKFL)

## Hardware and filesystem

- [ ] **A Windows/NTFS store root.** CI runs on Linux only. Renaming over an existing file, sharing violations from antivirus or the search indexer holding a handle, unlink refused on an open file, and the directory `fsync` NTFS cannot do are properties of the filesystem. Mocked error codes prove the retry logic; only a real Windows box shows whether those are the codes NTFS raises. This is the one most worth doing by hand before release (verifies spec: CAS, FEC)
- [ ] **A genuinely full volume.** `statfs` is injected in every capacity test, so nothing ever meets a real short write or a kernel `ENOSPC` partway through a large admission. Filling a real volume is the only way to confirm the store refuses before the database is starved, which is the whole point of the floor (verifies spec: CAP)
- [ ] **Failing media.** The correction-rate signal exists to say a disk is dying before it produces unrecoverable loss. Tests seed shard-aligned damage, which is the recoverable case by construction; whether real bit rot lands within a shard needs hardware that is actually failing (verifies spec: FEC)
- [ ] **Scrub and retrofit throughput at realistic store size.** Whether a scrub cycle brings an existing site under parity in acceptable time, and whether the default per-pass bounds complete a verification cycle within the target, are questions about real disk throughput (verifies spec: SCRUB, FEC)

## External services and devices

- [ ] **A real clamd.** The driver is tested against a fake socket that speaks INSTREAM framing back at it. Nothing confirms the framing against a real daemon, that an EICAR file comes back FOUND, or that the signature version string a real clamd reports actually changes on a signature update. That last one is load-bearing: the re-scan trigger is a version comparison, so a daemon reporting a constant string would silently never re-scan (verifies spec: AV)
- [ ] **Mobile capture through the real camera and picker.** Everything from the camera through resize to moving the file into the store runs against native modules and real storage permissions, which the in-memory filesystem stands in for entirely (verifies spec: MOB)
- [ ] **Real device storage pressure.** The budget re-derivation depends on what Android reports as the device fills with unrelated data. The fake filesystem returns whatever a test sets, so only a real device shows whether the derived reserve keeps the app usable when storage is tight (verifies spec: MOB, CAP)
- [ ] **Many small blobs over a real facility link.** Whether concurrent per-hash requests multiplex efficiently over one shared connection depends on the real proxy, TLS termination and link latency. A local harness would measure the harness (verifies spec: XFER)

## Deployment behaviour

- [ ] **Two-facility content-pending.** Facility A uploads a document, facility B opens it before the push lands, and sees an existing file awaiting its content. Arrangeable in a browser only awkwardly, natural on a real deployment (verifies spec: XFER, ATCH)
- [ ] **Whether prefetch beats print time in the field.** A test proves the pass runs after each sync; whether a facility on a real intermittent link has its assets by the time staff print is a deployment observation (verifies spec: ASSET)
- [ ] **A real backup and restore cycle.** Database capture then store capture, pairing the two, transferring only blobs added since the last cycle, and restoring the pair. All bestool orchestration against real storage in another repo (verifies spec: BKUP)
- [ ] **A real restore's convergence.** The runbook's checks are read-only diagnostics against a live restored facility: that the store came back at the path `blobStorage.root` names, that the content-pending count falls over the following hours, and that the outbox is draining. Each needs a real restore and elapsed time (verifies spec: BKUP, SCRUB)
- [ ] **Upgrade rehearsal against a restored facility backup.** The stated reason facility backups capture the store is so an upgrade can be rehearsed against a faithful copy. That rehearsal is a procedure a person runs (verifies spec: BKUP)

## Judgement

- [ ] **Whether the artwork looks right on a rendered document.** Placement, scale, watermark opacity and footer sizing on a printed certificate or letter. Automation can prove the bytes reached the renderer, not that the result is presentable (verifies spec: ASSET)
- [ ] **Whether the awaiting-content and no-internet messages read correctly in context**, on the web and on a device (verifies spec: ATCH, MOB)
- [ ] **Operator-facing settings text.** The parity proportion's cost is conveyed only by its help text, and the three serve-policy postures by their option labels. Whether an administrator reads those correctly before flipping them is a human judgement, and the consequence of getting the posture wrong is clinicians losing access to files (verifies spec: FEC, AV)

The Windows case and the clamd signature-version case are the two worth doing by
hand before release. Both have a branch that CI never runs, and both fail silently
rather than loudly: a Windows placement that cannot rename, and a scanner that
never re-scans because its version string never moves.
