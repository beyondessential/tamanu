import { ISurveyScreenComponent } from '~/types/ISurvey';
import { create, all as allMath } from 'mathjs';

export function runCalculations(components: ISurveyScreenComponent[], values: {}): {} {
  // set up math context
  const math = create(allMath);

  // run calculations
  const calculatedValues = {
    ...values
  };

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
