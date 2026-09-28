// spec: ASSET
// Returns undefined when there's no asset, so an optional element renders without it.
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
