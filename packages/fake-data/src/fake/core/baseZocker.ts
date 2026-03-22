import { z } from 'zod';
import { zocker } from 'zocker';
import { faker } from '@faker-js/faker';

import {
  dateCustomValidation,
  datetimeCustomValidation,
  toDateTimeString,
  toDateString,
} from '@tamanu/utils/dateTime';
import { foreignKey } from '@tamanu/shared/schemas/types';

export interface SchemaGenerator {
  generate(): any;
}

export function createBaseZocker(schema: z.ZodType): SchemaGenerator {
  return zocker(schema)
    .supply(foreignKey, undefined)
    .supply(datetimeCustomValidation, () => toDateTimeString(faker.date.recent()))
    .supply(dateCustomValidation, () => toDateString(faker.date.recent()));
}
