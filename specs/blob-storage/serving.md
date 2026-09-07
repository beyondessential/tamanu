---
id: SERVE
---

# Serving blobs

Blob content is served over HTTP to clients authorised to read the referencing
record (see `access-control.md`). Because content is immutable and named by its
hash, serving is cache-friendly and supports large files without buffering them
whole.

## Caching

- [ ] A blob response carries its hash as a strong validator (entity tag), and
  because a hash names immutable content, the response may be cached indefinitely: a
  client that already holds the content for a hash does not fetch it again.

## Streaming and ranges

- [ ] Blob content is streamed rather than read into memory in full, so large files
  do not load entirely before serving begins.
- [ ] A blob response supports ranged requests, so a client can request part of a
  large file.

## Inline encoding

- [ ] A caller consuming content inline rather than as a download may request it
  base64-encoded in the response body.
- [ ] Inline encoding holds the whole content and its encoding in memory, so it is
  offered only up to a size limit that the inline consumers stay well within.
  Content past that limit is refused inline, with the caller directed to request
  it as a stream.
