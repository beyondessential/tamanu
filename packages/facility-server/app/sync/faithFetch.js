const MAX_ERROR_LENGTH = 200;

// faith reports a failure as the whole rust error chain, a few thousand characters that
// would land in the log line and the sync error record. The innermost segment is the
// diagnosis (ConnectionRefused, NoRecordsFound, a certificate error); everything above it
// restates the chain and leads with the request url, which is logged separately anyway.
export const summariseFaithError = ({ code, message }) => {
  const segments = message.split(' -> ');
  const summary = segments.length > 1 ? `${code}: ${segments.at(-1)}` : message;
  return summary.length > MAX_ERROR_LENGTH ? `${summary.slice(0, MAX_ERROR_LENGTH)}…` : summary;
};

// Loaded on first use, so TAMANU_DISABLE_FAITH_FETCH also covers the native binding
// failing to load: with faith off the server never reaches for it.
let faith;

export const faithFetch = async (url, options) => {
  const { fetch } = await (faith ??= import('@passcod/faith'));
  try {
    return await fetch(url, options);
  } catch (error) {
    if (!error.code) throw error;
    throw new Error(summariseFaithError(error), { cause: error });
  }
};
