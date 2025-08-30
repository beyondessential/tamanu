// Require K (keys), make everything else optional
export type WithRequired<T, K extends keyof T> = { [P in K]-?: NonNullable<T[P]> } & Partial<
  Omit<T, K>
>;

export type KeyList<T> = readonly (keyof T)[];

export const keysFor =
  <T>() =>
  <const K extends KeyList<T>>(...k: K) =>
    k;
