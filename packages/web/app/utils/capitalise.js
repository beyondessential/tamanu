export function capitaliseFirstLetter(text) {
  if (!text) return '';
  const a = text?.slice(0, 1);
  if (a === undefined) console.log('10');
  const b = text?.slice(1);
  if (b === undefined) console.log('11');
  return a.toUpperCase() + b;
}
