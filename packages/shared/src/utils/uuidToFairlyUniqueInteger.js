// takes the first 6 bytes of the uuid and creates an integer
// - collision rate of around one per hundred million uuids
// - small enough to fit inside a JS integer
export const uuidToFairlyUniqueInteger = id =>
  Number(`0x${id.replaceAll('-', '').substring(0, 12)}`);
