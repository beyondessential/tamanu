const compressThresholdBytes = 1024;

/**
 * Serialise a JSON request body for upload with `Content-Encoding: gzip`.
 *
 * React Native's networking layer natively gzips *string* request bodies when
 * that header is set (and strips the header for any other body type), so the
 * body must go out as a pre-serialised JSON string rather than gzipped bytes.
 *
 * Returns null for small bodies, which should be sent as plain JSON instead.
 */
export const compressibleRequestBody = (body: unknown): string | null => {
  const json = JSON.stringify(body);
  return json.length >= compressThresholdBytes ? json : null;
};
