export const createValueIndex = options =>
  options.reduce(
    (index, option) => ({
      ...index,
      [option.value]: option,
    }),
    {},
  );
