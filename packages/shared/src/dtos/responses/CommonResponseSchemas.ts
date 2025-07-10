import { z } from 'zod';

// Common response wrapper for array endpoints
export const ArrayResponseSchema = z.object({
  data: z.array(z.unknown()),
  count: z.number().optional(),
});

// Common response wrapper for paginated endpoints
export const PaginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  count: z.number(),
  offset: z.number().optional(),
  limit: z.number().optional(),
});

export type ArrayResponse = z.infer<typeof ArrayResponseSchema>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>;
