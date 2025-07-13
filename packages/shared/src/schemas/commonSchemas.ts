import { z } from 'zod';

import { SEX_VALUES } from '@tamanu/constants';

export const SexSchema = z.enum(Object.values(SEX_VALUES) as [string, ...string[]]);

export type Sex = z.infer<typeof SexSchema>;
