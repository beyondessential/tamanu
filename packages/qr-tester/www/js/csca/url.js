export default async function publicKeys(url) {
  const key = await fetch(url).then(r => r.text());
  return [KEYUTIL.getKey(key)];
}
