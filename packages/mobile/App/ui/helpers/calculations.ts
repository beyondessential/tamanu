import { all as allMath, create } from 'mathjs';
import { isNumber } from 'es-toolkit/compat';
import { assertCalculationInScope } from '@tamanu/utils/calculationExpression';
import type { ISurveyScreenComponent } from '~/types/ISurvey';

// set up math context
const math = create(allMath);

export function runCalculations(components: ISurveyScreenComponent[], values: any): any {
  const inputValues = { ...values };
  const calculatedValues = {};

  for (const c of components) {
    if (c.calculation) {
      try {
        const expression = math.parse(c.calculation);
        assertCalculationInScope(expression, inputValues);
        let value = expression.compile().evaluate(inputValues);
        if (!Number.isFinite(value)) {
          throw new Error('Value is not a valid number');
        }
        const config = c.getConfigObject();
        if (isNumber(config.rounding)) {
          value = parseFloat(parseFloat(value).toFixed(config.rounding));
        }
        inputValues[c.dataElement.code] = value;
        calculatedValues[c.dataElement.code] = value;
      } catch {
        calculatedValues[c.dataElement.code] = null;
      }
    }
  }

  return calculatedValues;
}
