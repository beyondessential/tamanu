const makeId = s =>
  s
    .trim()
    .replace(/\s/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase();
const split = s =>
  s
    .split(/[\r\n]+/g)
    .map(x => x.trim())
    .filter(x => x);
export const splitIds = ids => split(ids).map(s => ({ _id: makeId(s), name: s }));
