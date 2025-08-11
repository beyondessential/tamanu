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
    const formattedIssues =
      validationResult.error.issues?.map(issue => ({
        path: issue.path?.join('.') || 'root',
        message: issue.message,
        code: issue.code,
        received: issue.received,
      })) || [];

    log.error('Validation failed', {
      errorCount: validationResult.error.issues?.length || 0,
      issues: JSON.stringify(formattedIssues, null, 2),
      requestBody: JSON.stringify(body, null, 2),
    });

    const issuesSummary = formattedIssues
      .map(issue => `${issue.path}: ${issue.message} (received: ${JSON.stringify(issue.received)})`)
      .join('; ');

    log.error(`Validation errors summary: ${issuesSummary}`);
  }
  return validationResult.success ? validationResult.data : body;
};
