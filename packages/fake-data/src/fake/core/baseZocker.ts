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

export const createBaseZocker: <TSchema extends z.ZodType>(
  schema: TSchema,
) => ReturnType<typeof zocker> = schema => {
  return zocker(schema)
    .supply(foreignKey, undefined)
    .supply(datetimeCustomValidation, () => toDateTimeString(faker.date.recent()))
    .supply(dateCustomValidation, () => toDateString(faker.date.recent()));
};
