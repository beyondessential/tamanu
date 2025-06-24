import { z } from 'zod';
import { faker } from '@faker-js/faker';

type MockInput<T extends z.ZodTypeAny> = {
  schema: z.ZodObject<any>;
  mock: Record<string, any>;
  excludedFields?: (keyof z.infer<T>)[];
};

export const processMock = <T extends z.ZodObject<any>>({
  schema,
  mock,
  excludedFields = [],
}: MockInput<T>) => {
  const shape = schema.shape;

  for (const key in shape) {
    const schemaEntry = shape[key];
    const desc = schemaEntry.description;

    // For now we rely on custom field descriptions to determine how to fake the data
    if (typeof desc === 'string') {
      if (desc.includes('__foreignKey__')) {
        mock[key] = undefined;
      } else if (desc.includes('__dateCustomValidation__')) {
        mock[key] = faker.date.recent().toISOString().split('T')[0];
      } else if (desc.includes('__datetimeCustomValidation__')) {
        mock[key] = faker.date.recent().toISOString();
      }
    }
  }

  for (const field of excludedFields) {
    delete mock[field as string];
  }

  return mock;
};
