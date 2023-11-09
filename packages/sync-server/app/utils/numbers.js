export const isNumberOrFloat = value => {
  if (typeof value !== 'number') {
    return false;
  }

  return !isNaN(value);
};
