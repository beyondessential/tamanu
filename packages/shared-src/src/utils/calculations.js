import { create, all as allMath } from 'mathjs';

// set up math context
const math = create(allMath);

export function runCalculations(components, values) {
  const inputValues = {};
  // calculation expression use "code"
  for (const c of components) {
    inputValues[c.dataElement.code] = values[c.dataElement.id];
  }

  const calculatedValues = {};
  for (const c of components) {
    if (c.calculation) {
      try {
        const value = math.evaluate(c.calculation, inputValues);
        if (Number.isNaN(value)) {
          throw new Error('Value is NaN');
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
