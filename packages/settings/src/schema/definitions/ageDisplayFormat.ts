import * as yup from 'yup';

const NONNEGATIVE_INTEGER = yup
  .number()
  .integer()
  .min(0);

const ageRangeLimitSchema = yup.object({
  duration: yup
    .object({
      years: NONNEGATIVE_INTEGER,
      months: NONNEGATIVE_INTEGER,
      days: NONNEGATIVE_INTEGER,
    })
    .noUnknown(),
  exclusive: yup.boolean(),
});

const formatRangeSchema = yup
  .object({
    min: ageRangeLimitSchema,
    max: ageRangeLimitSchema,
  })
  .required()
  .test({
    name: 'ageDisplayFormat-range',
    test(range, ctx) {
      if (!range.min && !range.max) {
        return ctx.createError({
          message: `range in ageDisplayFormat must include either min or max, or both, got ${JSON.stringify(
            range,
          )}`,
        });
      }

      return true;
    },
  });

const formatItemSchema = yup.object({
  as: yup
    .string()
    .oneOf(['days', 'weeks', 'months', 'years'])
    .required(),
  range: formatRangeSchema,
});

export const ageDisplayFormatSchema = yup.array(formatItemSchema).test({
  name: 'ageDisplayFormat-fallback',
  message:
    'One of ranges in ‘ageDisplayFormat’ must have no maximum set. (It should be an open interval)',
  test: formats => {
    if (formats === undefined) return true; // Don’t fail validation if falling back to default value
    return formats.some(f => f.range.max === undefined);
  },
});

export const ageDisplayFormatDefault = [
  {
    as: 'days',
    range: {
      min: { duration: { days: 0 }, exclusive: false },
      max: { duration: { days: 8 }, exclusive: true },
    },
  },
  {
    as: 'weeks',
    range: {
      min: { duration: { days: 8 } },
      max: { duration: { months: 1 }, exclusive: true },
    },
  },
  {
    as: 'months',
    range: {
      min: { duration: { months: 1 } },
      max: { duration: { years: 2 }, exclusive: true },
    },
  },
  {
    as: 'years',
    range: {
      min: { duration: { years: 2 } },
    },
  },
];
