import config from 'config';
import {
  TupaiaApiClient,
  BasicAuthHandler,
  LOCALHOST_ENDPOINT_BASE_URLS,
  DEV_BASE_URLS,
  ENDPOINT_BASE_URLS,
} from '@tupaia/api-client';

export const createTupaiaApiClient = () => {
  if (!config.tupaiaApiClient?.auth) {
    throw new Error('Must specify tupaiaApiClient.auth in config');
  }

  const { username, password } = config.tupaiaApiClient.auth;

  const auth = new BasicAuthHandler(username, password);

  let baseUrls = null;

  const { environment } = config.tupaiaApiClient;
  switch (environment) {
    case 'dev':
      baseUrls = DEV_BASE_URLS;
      break;
    case 'local':
      baseUrls = LOCALHOST_ENDPOINT_BASE_URLS;
      break;
    case 'production':
      baseUrls = ENDPOINT_BASE_URLS;
      break;
    default:
      throw new Error('Must specify a valid tupaiaApiClient.environment');
  }

  return new TupaiaApiClient(auth, baseUrls);
};

export const translateReportDataToSurveyResponses = (surveyId, reportData) => {
  const [headerRow, ...dataRows] = reportData;
  const translated = [];
  for (const dataRow of dataRows) {
    const translatedRow = {
      survey_id: surveyId,
      answers: {},
    };
    for (let i = 0; i < headerRow.length; i++) {
      const columnTitle = headerRow[i];
      if (['entity_code', 'timestamp'].includes(columnTitle)) {
        translatedRow[columnTitle] = dataRow[i];
      } else {
        translatedRow.answers[columnTitle] = dataRow[i];
      }
    }
    translated.push(translatedRow);
  }
  return translated;
};
