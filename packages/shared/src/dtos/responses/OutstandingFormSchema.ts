import { z } from 'zod';

export const OutstandingFormSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  formType: z.string(),
  status: z.enum(['pending', 'overdue']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OutstandingFormArraySchema = z.array(OutstandingFormSchema);

export type OutstandingForm = z.infer<typeof OutstandingFormSchema>;
