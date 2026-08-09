// spec: ASSET
// An asset's image bytes, resolved from whichever form the row takes: content
// held in the blob store addressed by `hash`, or legacy bytes carried inline in
// `data`. `openBlob(hash)` yields a readable stream of the blob's bytes — the
// central store's read on the central server, the read-through cache on a
// facility. Returns undefined when there is no asset to read, so an optional
// document element simply renders without it.
export async function resolveAssetImageData(asset, openBlob) {
  if (!asset) return undefined;
  if (!asset.hash) return asset.data ?? undefined;
  const stream = await openBlob(asset.hash);
  return await streamToBuffer(stream);
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
