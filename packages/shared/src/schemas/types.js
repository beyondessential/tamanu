import { z } from 'zod';

export const foreignKey = z.string().describe('__foreignKey__');
