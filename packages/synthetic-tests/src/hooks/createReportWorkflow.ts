import { GENERIC_SURVEY_EXPORT_REPORT_ID } from '@tamanu/constants';

const DEFAULT_LINE_LIST_REPORT_ID = GENERIC_SURVEY_EXPORT_REPORT_ID;

type SurveyRow = { id: string };
type SurveyListResponse = { surveys?: SurveyRow[] } | SurveyRow[];

function getConfiguredLineListReportId(context: any): string {
  return (
    context.vars.syntheticLineListReportId ??
    context.vars.SYNTHETIC_LINE_LIST_REPORT_ID ??
    DEFAULT_LINE_LIST_REPORT_ID
  );
}

async function resolveSurveyId(context: any): Promise<string> {
  const configuredSurveyId =
    context.vars.syntheticLineListSurveyId ?? context.vars.SYNTHETIC_LINE_LIST_SURVEY_ID;
  if (configuredSurveyId) {
    return configuredSurveyId;
  }

  const { api } = context.vars;
  const response = (await api.get('survey')) as SurveyListResponse;
  const surveys = Array.isArray(response) ? response : response?.surveys ?? [];
  const firstSurvey = surveys[0];
  if (!firstSurvey?.id) {
    throw new Error(
      'No surveys available for line list report; set syntheticLineListSurveyId or seed survey data',
    );
  }
  return firstSurvey.id;
}

/**
 * Build payload for POST /api/reports/:id using the hardcoded line list report.
 * Survey id can be overridden by syntheticLineListSurveyId / SYNTHETIC_LINE_LIST_SURVEY_ID.
 */
export async function prepareLineListReportPayload(context: any, _events: any): Promise<void> {
  const surveyId = await resolveSurveyId(context);
  const lineListReportId = getConfiguredLineListReportId(context);
  const { facilityId } = context.vars;

  context.vars = {
    ...context.vars,
    lineListReportId,
    lineListReportPayload: {
      facilityId,
      parameters: { surveyId },
    },
  };
}
