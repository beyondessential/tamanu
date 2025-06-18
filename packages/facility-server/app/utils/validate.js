import { log } from '@tamanu/shared/services/logging/log';

/**
 * Validates request body against a Zod schema and logs validation errors
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {*} body - The request body to validate
 * @returns {*} The validated data if successful, undefined if validation fails
 */
export const validate = (schema, body) => {
  log.info('Validating body:', body);
  const validationResult = schema.safeParse(body);
  if (!validationResult.success) {
    // We just want to log errors at the moment
    log.error('Validation error:', JSON.stringify(validationResult.error, null, 2), {
      body: JSON.stringify(body, null, 2),
    });
  }
  return validationResult.success ? validationResult.data : body;
};
