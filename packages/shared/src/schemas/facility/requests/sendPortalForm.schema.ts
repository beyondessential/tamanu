import { z } from 'zod';

export const SendPortalFormRequestSchema = z.object({
  formId: z.string(),
  assignedAt: z.string(),
  email: z.email().nullish(),
  facilityId: z.string(),
});

export type SendPortalFormRequest = z.infer<typeof SendPortalFormRequestSchema>;
