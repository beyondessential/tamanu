import { ISurveyScreenComponent } from '~/types/ISurvey';

export function runCalculations(components: ISurveyScreenComponent[], values: {}): {} {
  const calculatedResults = {};
  for(const c of components) {
    if(!c.calculation) continue;
    calculatedResults[c.dataElement.code] = 1;
  }
  return calculatedResults;
}
