const makeCode = (x: string): string => x.replace(/\W/g, '').toUpperCase();

export const splitIds = (values: string): { id: string; code: string; name: string }[] =>
  values
    .split(/\n/)
    .map(x => x.trim())
    .filter(x => x)
    .map(x => ({
      name: x,
      code: makeCode(x),
      id: makeCode(x),
    }));
