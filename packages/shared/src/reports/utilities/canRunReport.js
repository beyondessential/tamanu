import { GENERIC_SURVEY_EXPORT_REPORT_ID } from '@tamanu/constants';
import { canRunSurveyReport } from './canRunSurveyReport';

/**
 * Whether an ability may run the report with the given parameters.
 *
 * @param ability the ability of the user running the report
 * @param definition the report's ReportDefinition
 * @param parameters the report's parameters, as an object
 */
export function canRunReport(ability, definition, parameters) {
  if (!ability.can('run', definition)) return false;

  // The generic survey export also requires Survey:read for the specific survey being exported
  if (definition.id === GENERIC_SURVEY_EXPORT_REPORT_ID) {
    return canRunSurveyReport(ability, parameters?.surveyId);
  }
  return true;
}
