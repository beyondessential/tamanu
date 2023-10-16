import * as yup from 'yup';
import { isNumberOrFloat } from '../../utils/numbers';

// Applies to:
// normalRange (validationCriteria of SurveyScreenComponent)
// graphRange (visualisationConfig of ProgramDataElement)
export const rangeObjectSchema = yup
  .object()
  .shape({
    min: yup.number(),
    max: yup.number(),
    ageUnit: yup.string().oneOf(['years', 'months', 'weeks']),
    ageMin: yup.number(),
    ageMax: yup.number(),
  })
  .noUnknown()
  .test({
    name: 'is-min-and-max-valid',
    message: ctx => `${ctx.path} should have either min or max, got ${JSON.stringify(ctx.value)}`,
    test: value => {
      if (!value) {
        return true;
      }
      return isNumberOrFloat(value.min) || isNumberOrFloat(value.max);
    },
  })
  .test({
    name: 'is-age-range-valid',
    message: ctx => `${ctx.path} should have a valid age range.`,
    test: value => {
      if (!value) {
        return true;
      }
      const { ageMin, ageMax } = value;

      // Given we need to support the old format, these could be undefined
      if (ageMin === undefined && ageMax === undefined) {
        return true;
      }

      const atLeastOne = isNumberOrFloat(ageMin) || isNumberOrFloat(ageMax);
      // Ensure both are not zero (comparison below won't work for that scenario)
      const notEqual = ageMin !== ageMax;
      // Min inclusive - max exclusive: cannot be the same
      const minLessThanMax = (ageMin || -Infinity) < (ageMax || Infinity);
      return atLeastOne && notEqual && minLessThanMax;
    },
  });
