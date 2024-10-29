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

// Helper function to extract variable names from a calculation expression
const extractVariables = (expression) => {
  const variableRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g;
  return [...new Set(expression.match(variableRegex))]; // Extract unique variable names
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
        // Extract the required variables for this calculation
        const requiredVariables = extractVariables(c.calculation);

        const relevantInputs = {};
        for (const variable of requiredVariables) {
          relevantInputs[variable] = inputValues[variable] ?? '';
        }

        const isInputsEmpty = Object.values(relevantInputs).every(value => value === '');

        if (requiredVariables.length && isInputsEmpty) {
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
