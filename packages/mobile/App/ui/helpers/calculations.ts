import { ISurveyScreenComponent } from '~/types/ISurvey';
import { create, all as allMath } from 'mathjs';

// set up math context
const math = create(allMath);

export function runCalculations(
  components: ISurveyScreenComponent[], 
  values: any
): any {
  const inputValues = { ...values };
  const calculatedValues = {};

  for(const c of components) {
    if(!c.calculation) continue;

    try {
      const value = math.evaluate(c.calculation, inputValues);
      inputValues[c.dataElement.code] = value;
      calculatedValues[c.dataElement.code] = value;
    } catch(e) {
      console.warn(e);
    }
  }

  return calculatedValues;
}
