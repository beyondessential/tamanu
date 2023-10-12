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
    name: 'range',
    message: ctx => `${ctx.path} should have either min or max, got ${JSON.stringify(ctx.value)}`,
    test: value => {
      if (!value) {
        return true;
      }
      return isNumberOrFloat(value.min) || isNumberOrFloat(value.max);
    },
  });
