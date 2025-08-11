import { z } from 'zod';
import { faker } from '@faker-js/faker';

/**
 * Formats a date as YYYY-MM-DD HH:MM:SS without milliseconds
 * This ensures compatibility with datetimeCustomValidation schema
 */
export const formatDateTimeForSchema = (date: Date): string => {
  return date.toISOString().substring(0, 19).replace('T', ' ');
};

type MockInput<T extends z.ZodObject<any>> = {
  schema: T;
  mock: Record<string, any>;
  excludedFields?: (keyof z.infer<T>)[];
};

const isUnwrappable = (
  schema: z.ZodType,
): schema is z.ZodOptional<any> | z.ZodNullable<any> | z.ZodDefault<any> | z.ZodArray<any> =>
  schema instanceof z.ZodOptional ||
  schema instanceof z.ZodNullable ||
  schema instanceof z.ZodDefault ||
  schema instanceof z.ZodArray;

const unwrap = (schema: z.ZodType): z.ZodType => {
  while (isUnwrappable(schema)) {
    schema = schema.unwrap();
  }
  return schema;
};

export const processMock = <T extends z.ZodObject<any>>({
  schema,
  mock,
  excludedFields = [],
}: MockInput<T>) => {
  const shape = schema.shape;

  for (const key in shape) {
    const schemaEntry = unwrap(shape[key]);

    const schemaMeta = schemaEntry.meta();

    // For now we rely on custom field descriptions to determine how to fake the data
    if (typeof schemaMeta === 'object') {
      if (schemaMeta.description?.includes('__foreignKey__')) {
        mock[key] = undefined;
      } else if (schemaMeta.description?.includes('__dateCustomValidation__')) {
        mock[key] = faker.date.recent().toISOString().split('T')[0];
      } else if (schemaMeta.description?.includes('__datetimeCustomValidation__')) {
        mock[key] = formatDateTimeForSchema(faker.date.recent());
      }
    }
  }

  for (const field of excludedFields) {
    delete mock[String(field)];
  }

  return mock;
};
