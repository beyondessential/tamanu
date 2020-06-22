export function camelify(string) {
  const [initial, ...subsequent] = string.split('_');
  const uppercased = subsequent.filter(x => x).map(s => s[0].toUpperCase() + s.slice(1));
  return [initial, ...uppercased].join('');
}

export function renameObjectKeys(baseObject) {
  return Object.keys(baseObject).reduce(
    (rebuilt, currentKey) => ({
      ...rebuilt,
      [camelify(currentKey)]: baseObject[currentKey],
    }),
    {},
  );
}
