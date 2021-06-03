import { log } from 'shared/services/logging';
import { readSurveyXSLX } from './surveyImporter';
import { sendSyncRequest } from './sendSyncRequest';


export async function importSurvey({ 
  file,
  programCode,
  programName, 
  surveyCode,
  surveyName,
  surveyType = 'programs',
}) {
  log.info(`Reading surveys from ${file}...`);

  const records = readSurveyXSLX(file);

  console.log(records);

  return records;
}
