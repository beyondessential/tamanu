import { z } from 'zod';

export const foreignKey = z.string().meta({
  description: '__foreignKey__',
});

export const stringWithMaxLength = z.string().max(255);
