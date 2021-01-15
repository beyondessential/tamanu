import { ISurveyScreenComponent } from '~/types/ISurvey';
import { create, all as allMath } from 'mathjs';

export function runCalculations(components: ISurveyScreenComponent[], values: {}): {} {
  const math = create(allMath);
  const calculatedResults = {};
  for(const c of components) {
    if(!c.calculation) continue;
    calculatedResults[c.dataElement.code] = math.evaluate(c.calculation);
  }
  return calculatedResults;
}
