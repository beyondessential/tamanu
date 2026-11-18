import * as mathjs from 'mathjs';
import * as yup from 'yup';
import { getCalculationVariables } from '@tamanu/utils/calculationExpression';

export const mathjsString = () =>
  yup.string().test({
    name: 'is-valid-mathjs-expression',
    test(value) {
      if (!value) {
        return true;
      }
      try {
        getCalculationVariables(mathjs.parse(value));
      } catch (e) {
        return this.createError({
          message: `${value} is not a valid calculation: ${e.message}`,
        });
      }
      return true;
    },
  });
