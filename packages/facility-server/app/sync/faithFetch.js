import { fetch } from '@passcod/faith';

const MAX_ERROR_LENGTH = 200;

// faith reports a failure as the whole Rust error chain, a few thousand characters of
// debug output that would land in the log line and the sync error record. The head of
// it holds the diagnosis: "dns error", "tcp connect error", a certificate failure.
export const summariseFaithError = message => {
  const [head] = message.split(' -> ');
  return head.length > MAX_ERROR_LENGTH ? `${head.slice(0, MAX_ERROR_LENGTH)}…` : head;
};

export const faithFetch = async (url, options) => {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (!error.code) throw error;
    throw new Error(summariseFaithError(error.message), { cause: error });
  }
};
