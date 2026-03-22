import { ZodType } from 'zod';

/**
 * Generic transform function for endpoints that return a single `data` object.
 */
export function transformSingle<T>(schema: ZodType<T>) {
  return (response: unknown): T => {
    const responseData = response as { data: unknown };
    if (!responseData?.data) {
      throw new Error('Data not found');
    }

    return schema.parse(responseData.data);
  };
}

/**
 * Generic transform function for endpoints that return a `data` array.
 */
export function transformArray<T>(schema: ZodType<T>) {
  return (response: unknown): T[] => {
    const responseData = response as { data: unknown[] };
    if (!responseData?.data || !Array.isArray(responseData.data)) {
      return [];
    }

    return responseData.data.map(item => schema.parse(item));
  };
}
