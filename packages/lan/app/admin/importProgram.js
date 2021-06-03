import { log } from 'shared/services/logging';
import { readSurveyXSLX } from './surveyImporter';
import { sendSyncRequest } from './sendSyncRequest';

const idify = name => name.toLowerCase().replace(/\W/g, '');

const makeRecord = (recordType, data) => ({
  recordType,
  data,
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
        id: `pde-${elementData.code}`,
        defaultOptions: '',
        ...elementData,
      });

      const surveyScreenComponent = makeRecord('surveyScreenComponent', {
        id: `${componentData.surveyId}-${elementData.code}`,
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
    id: `${programElement.data.id}-${idify(surveyCode)}`,
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

  return [
    programElement,
    surveyElement,
    ...screenElements,
  ];
}
