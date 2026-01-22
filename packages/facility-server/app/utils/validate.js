import { z } from 'zod';

import { log } from '@tamanu/shared/services/logging/log';

/**
 * Validates request body against a Zod schema and logs validation errors
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {*} body - The request body to validate
 * @returns {*} The validated data if successful, undefined if validation fails
 */
export const validate = (schema, body) => {
  const validationResult = schema.safeParse(body);
  if (!validationResult.success) {
    // We just want to log errors at the moment
    const prettyError = z.prettifyError(validationResult.error);

    log.error(`Validation failed: ${prettyError}`);
  }
  return validationResult.success ? validationResult.data : body;
};
