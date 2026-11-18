import { all as allMath, create } from 'mathjs';
import { createCalculationPreparer } from '@tamanu/utils/calculationExpression';

// set up math context
const math = create(allMath);

const prepareCalculation = createCalculationPreparer(calculation => math.parse(calculation));

function getConfigObject(componentId, config) {
  if (!config) return {};
  try {
    return JSON.parse(config);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Invalid config in survey screen component ${componentId}`);
    return {};
  }
}

export function runCalculations(components, values) {
  const inputValues = {};
  // calculation expression use "code"
  for (const c of components) {
    inputValues[c.dataElement.code] = values[c.dataElement.id] ?? '';
  }
  const calculatedValues = {};

  for (const c of components) {
    if (c.calculation) {
      try {
        const { variables, evaluate } = prepareCalculation(c.calculation, inputValues);

        const variableInputs = {};
        for (const variable of variables) {
          variableInputs[variable] = inputValues[variable] ?? '';
        }

        const isInputsEmpty = Object.values(variableInputs).every(value => value === '');

        if (variables.length && isInputsEmpty) {
          // Skip calculation if every input is empty
          calculatedValues[c.dataElement.id] = null;
          continue;
        }

        let value = evaluate();

        if (Number.isNaN(value)) {
          throw new Error('Value is NaN');
        }
        const config = getConfigObject(c.id, c.config);
        if (config.rounding) {
          value = parseFloat(parseFloat(value).toFixed(config.rounding));
        }
        inputValues[c.dataElement.code] = value;
        calculatedValues[c.dataElement.id] = value;
      } catch (e) {
        calculatedValues[c.dataElement.id] = null;
      }
    }
  }

  return calculatedValues;
}
