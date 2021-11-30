import { create, all as allMath } from 'mathjs';

// set up math context
const math = create(allMath);

export function runCalculations(components, values) {
  const inputValues = { ...values };
  const calculatedValues = {};

  for (const c of components) {
    if (c.calculation) {
      try {
        const value = math.evaluate(c.calculation, inputValues);
        if (Number.isNaN(value)) {
          throw new Error('Value is NaN');
        }
        inputValues[c.dataElement.code] = value;
        calculatedValues[c.dataElement.code] = value.toFixed(2);
      } catch (e) {
        calculatedValues[c.dataElement.code] = null;
      }
    }
  }

  return calculatedValues;
}
