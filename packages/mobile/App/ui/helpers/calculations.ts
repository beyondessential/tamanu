import { ISurveyScreenComponent } from '~/types/ISurvey';
import { create, all as allMath } from 'mathjs';

// set up math context
const math = create(allMath);

export function runCalculations(
  components: ISurveyScreenComponent[], 
  values: any
): any {
  const calculatedValues = { ...values };

  for(const c of components) {
    if(!c.calculation) continue;
    try {
      calculatedValues[c.dataElement.code] = math.evaluate(c.calculation, calculatedValues);
    } catch(e) {
      console.warn(e);
    }
  }

  return calculatedValues;
}
