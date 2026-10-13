import { z } from 'zod';
import { zocker } from 'zocker';

import {
  dateCustomValidation,
  datetimeCustomValidation,
  toDateTimeString,
  toDateString,
} from '@tamanu/utils/dateTime';
import { foreignKey } from '@tamanu/shared/schemas/types';

import { chance } from '../fake.js';

export interface SchemaGenerator {
  generate(): any;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const recentDate = () => new Date(Date.now() - chance.integer({ min: 0, max: DAY_MS }));

export function createBaseZocker(schema: z.ZodType): SchemaGenerator {
  return zocker(schema)
    .setSeed(chance.integer({ min: 0, max: 2 ** 31 - 1 }))
    .supply(foreignKey, undefined)
    .supply(datetimeCustomValidation, () => toDateTimeString(recentDate()))
    .supply(dateCustomValidation, () => toDateString(recentDate()));
}
