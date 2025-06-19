import { z } from 'zod';

export const overrideForeignKeys = (schemaShape: z.ZodRawShape, mock: Record<string, any>) => {
  for (const key in schemaShape) {
    const schema = schemaShape[key];
    if (typeof schema.description === 'string' && schema.description.includes('__foreignKey__')) {
      mock[key] = undefined;
    }
  }
  return mock;
};

export const removeExcludedFields = <T extends z.ZodTypeAny>(
  mock: Record<string, any>,
  excludedFields: (keyof z.infer<T>)[],
) => {
  for (const key of excludedFields) {
    delete mock[key as string];
  }
  return mock;
};

export const processMock = <T extends z.ZodObject<any>>(
  schema: T,
  mock: Record<string, any>,
  excludedFields: (keyof z.infer<T>)[] = [],
) => {
  // First override foreign keys
  overrideForeignKeys(schema.shape, mock);

  // Then remove excluded fields
  removeExcludedFields(mock, excludedFields);

  return mock;
};
