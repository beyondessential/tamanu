export const createValueIndex = <T extends { value: string }>(options: T[]) =>
  options.reduce(
    (index, option) => ({
      ...index,
      [option.value]: option,
    }),
    {},
  );
