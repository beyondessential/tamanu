import shortid from 'shortid';

import { log } from '../logging';
import { readSurveyXSLX } from '../surveyImporter';
import { sendSyncRequest } from './sendSyncRequest';

const idify = name => name.toLowerCase().replace(/\W/g, '-');

const makeRecord = (recordType, data) => ({
  recordType,
  data: {
    id: shortid(),
    ...data,
  }
});

function makeScreen(screen, componentData) {
  return screen.dataElements.map(((component, i) => {
    const {
      visibilityCriteria = '',
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
      ...componentData,
    });

    return [dataElement, surveyScreenComponent];
  })).flat();
}

export async function importSurvey(taskDefinition) {
  const {
    file,
    programCode,
    programName,
    surveyCode,
    surveyName,
  } = taskDefinition;
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
  });

  // data and component elements
  const screenElements = data.screens.map((x, i) => makeScreen(x, {
    surveyId: surveyElement.data.id,
    screenIndex: i,
  })).flat();

  await sendSyncRequest('survey', [
    programElement,
    surveyElement,
    ...screenElements,
  ]);

  log.info("Program records uploaded.");
}

