import { z } from 'zod';

export const getAttributesFromSchema = schema => {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Schema must be an instance of ZodObject');
  }

  return Object.keys(schema.shape).filter(key => !(schema.shape[key] instanceof z.ZodObject));
};
