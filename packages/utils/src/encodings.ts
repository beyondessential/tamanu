export const pem = (data: Buffer, banner: string) => {
  return `-----BEGIN ${banner}-----\n${data
    .toString('base64')
    .match(/.{1,64}/g)
    ?.join('\n')}\n-----END ${banner}-----`;
};

/**
 * Decode a PEM document to a Buffer of DER data.
 */
export const depem = (pemString: string, expectedBanner: string) => {
  const text = pemString.trim();

  const beginRx = /^-{5}\s*BEGIN ?([^-]+)?-{5}\r?\n/;
  const endRx = /\r?\n-{5}\s*END ?([^-]+)?-{5}$/;

  const beginMatch = text.match(beginRx);
  if (!beginMatch || beginMatch[1] !== expectedBanner) {
    throw new Error(`Missing start banner on PEM, expected '-----BEGIN ${expectedBanner}-----'`);
  }

  const endMatch = text.match(endRx);
  if (!endMatch || endMatch[1] !== expectedBanner) {
    throw new Error(`Missing end banner on PEM, expected '-----END ${expectedBanner}-----'`);
  }

  return Buffer.from(text.replace(/^--.+/gm, ''), 'base64');
};

/**
 * Encode the input to Base64, the URL variant.
 */
export const base64UrlEncode = (input: string | Buffer | ArrayBuffer) => {
  return Buffer.from(input instanceof ArrayBuffer ? Buffer.from(input) : input).toString(
    'base64url',
  );
};

/**
 * Decode the input string from Base64, the URL variant.
 */
export const base64UrlDecode = (input: string) => {
  return Buffer.from(input, 'base64url');
};

/**
 * Encodes Base64 string string to JSON.
 */
export const base64ToJson = <T = unknown>(base64str: string) => {
  return JSON.parse(Buffer.from(base64str, 'base64').toString('binary')) as T;
};

/**
 * Creates a JSON object with the input and converts it to a Base64 string.
 */
export const jsonToBase64 = (obj: Record<string, unknown>) => {
  return Buffer.from(JSON.stringify(obj), 'binary').toString('base64');
};

// Convert a file to a base64 string
export const convertToBase64 = (file: File) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        throw new Error('Failed to read file');
      }
      // Extract the base64 data from the data url for saving
      // See note for more details https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
      const base64Data = reader.result.split('base64,').pop();
      return resolve(base64Data);
    };
    reader.onerror = (conversionError) => reject(conversionError);
  });
