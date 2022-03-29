export function enumFromStringValue<T>(enm: { [s: string]: T }, value: string): T {
  if (!((Object.values(enm) as unknown) as string[]).includes(value)) {
    throw new Error(`Invalid value: ${value}`);
  }

  return (value as unknown) as T;
}

export function enumValues<T>(enm: { [s: string]: T }): T[] {
  return Object.values(enm) as T[];
}
