export function toBase64(obj) {
  return Buffer.from(JSON.stringify(obj), 'binary').toString('base64');
}

export function fromBase64(str) {
  return JSON.parse(Buffer.from(str, 'base64').toString('binary'));
}
