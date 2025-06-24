import { z } from 'zod';

export type RequiredFields<T> = {
  [K in keyof T as {} extends Pick<T, K> ? never : K]: T[K];
};

export type CreateSchemaOptions<T extends z.ZodTypeAny> = {
  required: RequiredFields<z.infer<T>>;
  excludedFields?: (keyof z.infer<T>)[];
  overrides?: Partial<z.infer<T>>;
};
