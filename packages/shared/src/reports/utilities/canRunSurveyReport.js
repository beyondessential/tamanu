import { subject } from '@casl/ability';

export function canRunSurveyReport(ability, surveyId) {
  return ability.can('read', subject('Survey', { id: surveyId }));
}
