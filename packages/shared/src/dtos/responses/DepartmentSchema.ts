import { z } from 'zod';

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Department = z.infer<typeof DepartmentSchema>;
