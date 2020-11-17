import fetch from 'node-fetch';
import config from 'config';
import shortid from 'shortid';

import { log } from '../logging';
import { readSurveyXSLX } from '../surveyImporter';

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
      visibilityCriteria,
      ...elementData
    } = component;

    const dataElement = makeRecord('programDataElement', {
      id: `dataElement/${elementData.code}`,
      code: elementData.code,
      name: elementData.name,
      defaultOptions: '',
      ...elementData,
    });
    
    const surveyScreenComponent = makeRecord('surveyScreenComponent', {
      id: `${componentData.surveyId}/component-${elementData.code}`,
      dataElementId: dataElement.data.id, 
      componentIndex: i,
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

  const records = [
    programElement,
    surveyElement,
    ...screenElements,
  ];

  log.info(`Syncing ${records.length} records to ${config.syncHost}...`);

  const channel = "program-import-test";
  const url = `${config.syncHost}/v1/sync/${channel}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': '1213',
    },
    body: JSON.stringify(records),
  });

  log.info("Program records uploaded. Response:", await response.json());
}

