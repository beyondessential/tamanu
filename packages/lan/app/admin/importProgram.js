import shortid from 'shortid';

import { log } from 'shared/services/logging';
import { readSurveyXSLX } from '../surveyImporter';
import { sendSyncRequest } from './sendSyncRequest';

const idify = name => name.toLowerCase().replace(/\W/g, '-');

const makeRecord = (recordType, data) => ({
  recordType,
  data: {
    id: shortid(),
    ...data,
  },
});

function makeScreen(screen, componentData) {
  return screen.dataElements
    .map((component, i) => {
      const {
        visibilityCriteria = '',
        validationCriteria = '',
        detail = '',
        config = '',
        calculation = '',
        ...elementData
      } = component;

      const dataElement = makeRecord('programDataElement', {
        id: `dataElement/${elementData.code}`,
        defaultOptions: '',
        ...elementData,
      });

      const surveyScreenComponent = makeRecord('surveyScreenComponent', {
        id: `${componentData.surveyId}/component-${elementData.code}`,
        dataElementId: dataElement.data.id,
        text: '',
        options: '',
        componentIndex: i,
        visibilityCriteria,
        validationCriteria,
        detail,
        config,
        calculation,
        ...componentData,
      });

      return [dataElement, surveyScreenComponent];
    })
    .flat();
}

export async function importSurvey({ 
  file,
  programCode,
  programName, 
  surveyCode,
  surveyName,
  surveyType = 'programs',
}) {
  log.info(`Reading surveys from ${file}...`);

  const data = readSurveyXSLX(programName, file);

  // main container elements
  const programElement = makeRecord('program', {
    id: `program-${idify(programCode)}`,
    name: programName,
  });

  const surveyElement = makeRecord('survey', {
    id: `${programElement.data.id}/survey-${idify(surveyCode)}`,
    name: surveyName,
    programId: programElement.data.id,
    surveyType,
  });

  // data and component elements
  const screenElements = data.screens
    .map((x, i) =>
      makeScreen(x, {
        surveyId: surveyElement.data.id,
        screenIndex: i,
      }),
    )
    .flat();

  console.log(screenElements.filter(x => x.data.id.match(/NCD_63/)));

  return {
    records: [
      programElement,
      surveyElement,
      ...screenElements,
    ],
  }
}
