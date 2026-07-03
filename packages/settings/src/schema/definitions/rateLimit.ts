import * as yup from 'yup';

import type { SettingsSchema } from '../../types';

// Declared in both global and facility scope (facility overrides global). The
// facility server reads it once at app build via the server's first facility.
export const rateLimitSchema: SettingsSchema = {
  name: 'Rate limiting',
  description: 'Request rate limits, keyed off the client IP (which respects proxy.trusted)',
  requiresRestart: true,
  properties: {
    enabled: {
      name: 'Enabled',
      description: 'Whether rate limiting applies at all',
      type: yup.boolean(),
      defaultValue: true,
    },
    global: {
      description: 'Permissive limit applied to every request as a DoS backstop',
      properties: {
        windowMs: {
          name: 'Window',
          type: yup.number().integer().positive(),
          defaultValue: 60000,
          unit: 'ms',
        },
        max: {
          name: 'Max requests',
          description: 'Maximum requests per window per IP',
          type: yup.number().integer().positive(),
          defaultValue: 600,
        },
      },
    },
    auth: {
      description:
        'Stricter limit for unauthenticated endpoints (login, refresh, password reset); successful requests are not counted',
      properties: {
        windowMs: {
          name: 'Window',
          type: yup.number().integer().positive(),
          defaultValue: 900000,
          unit: 'ms',
        },
        max: {
          name: 'Max requests',
          description: 'Maximum failed requests per window per IP',
          type: yup.number().integer().positive(),
          defaultValue: 30,
        },
      },
    },
  },
};
