import { isNil } from 'lodash';
import { all as allMath, create } from 'mathjs';

// set up math context
const math = create(allMath);

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

const isBuiltInFunction = name => {
  try {
    // see https://mathjs.org/docs/reference/functions/help.html
    math.help(name);
    return true;
  } catch (e) {
    return false;
  }
};

const extractVariables = calculation => {
  const parsed = math.parse(calculation);
  return parsed
    .filter(node => node.isSymbolNode && !isBuiltInFunction(node))
    .map(({ name }) => name);
};

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
        const variables = extractVariables(c.calculation);

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

        let value = math.evaluate(c.calculation, inputValues);

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

export const getStringOfCalculatedValue = value => {
  if (isNil(value)) {
    return '';
  }

  if (!(typeof value === 'number')) {
    throw new Error(
      `The result of a calculation must be a number, but got: ${value} (${typeof value})`,
    );
  }

  return value.toFixed(1);
};
