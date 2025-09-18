import { z } from 'zod';

const unwrap = schema => {
  while (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault
  ) {
    schema = schema.unwrap();
  }
  return schema;
};

export const getAttributesFromSchema = schema => {
  schema = unwrap(schema);

  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Schema must be an instance of ZodObject');
  }

  return Object.keys(schema.shape).filter(
    key => !(unwrap(schema.shape[key]) instanceof z.ZodObject),
  );
};
