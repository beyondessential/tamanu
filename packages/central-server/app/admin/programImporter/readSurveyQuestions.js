import { CHARTING_DATA_ELEMENT_IDS, PROGRAM_DATA_ELEMENT_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';

export function yesOrNo(value) {
  return !!(value && value.toLowerCase() === 'yes');
}

function newlinesToArray(data) {
  if (!data) return null;

  let split = ',';
  if (data.trim().match(/[\r\n]/)) {
    // multiline record - split on newlines instead
    split = /[\r\n]+/g;
  }

  const array = data
    .split(split)
    .map(x => x.trim())
    .filter(x => x);
  return JSON.stringify(array);
}

function makeMandatory(validationCriteria) {
  const { validationCriteria: originalValidationCriteria } = validationCriteria;
  return JSON.stringify({
    ...(originalValidationCriteria ? JSON.parse(originalValidationCriteria) : {}),
    mandatory: true,
  });
}

function applyComponentTypeOverrides(type, surveyComponent) {
  const { dataElementId } = surveyComponent;

  if (type === PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME || dataElementId === CHARTING_DATA_ELEMENT_IDS.dateRecorded) {
    const { validationCriteria } = surveyComponent;
    return {
      ...surveyComponent,
      validationCriteria: makeMandatory(validationCriteria),
    };
  }
  return surveyComponent;
}

function makeScreen(questions, componentData) {
  return questions.flatMap((component, i) => {
    const {
      visibilityCriteria = '',
      validationCriteria = '',
      detail = '',
      config: qConfig = '',
      calculation = '',
      row,
      type,
      visibilityStatus = VISIBILITY_STATUSES.CURRENT,
      visualisationConfig = '',
      ...elementData
    } = component;

    const { surveyId, ...otherComponentData } = componentData;
    const dataElId = `pde-${elementData.code}`;

    const deletedAt =
      VISIBILITY_STATUSES.HISTORICAL === visibilityStatus.toLowerCase() ? Date.now() : null;
    return [
      {
        model: 'ProgramDataElement',
        sheetRow: row,
        values: {
          id: dataElId,
          defaultOptions: '',
          type,
          visualisationConfig,
          ...elementData,
        },
      },
      {
        model: 'SurveyScreenComponent',
        sheetRow: row,
        values: applyComponentTypeOverrides(type, {
          id: `${surveyId}-${elementData.code}`,
          dataElementId: dataElId,
          surveyId,
          text: '',
          options: '',
          componentIndex: i,
          visibilityCriteria,
          validationCriteria,
          detail,
          config: qConfig,
          calculation,
          // Type won't be attached to the survey screen component but
          // different question types use different validation criteria
          type,
          ...otherComponentData,
          visibilityStatus,
          deletedAt,
        }),
      },
    ];
  });
}

function importDataElement(row) {
  const { newScreen, options, optionLabels, text, ...rest } = row;

  return {
    newScreen: yesOrNo(newScreen),
    defaultOptions: options,
    optionLabels: newlinesToArray(optionLabels),
    defaultText: text,
    // Note: __rowNum__ is a non-enumerable property, so needs to be accessed explicitly here
    // -1 as it'll have 2 added to it later but it's only 1 off
    row: row.__rowNum__ - 1,
    ...rest,
  };
}

// Break an array of questions into chunks, with the split points determined
// by a newScreen: true property. (with newScreen: true questions placed as
// the first element of each chunk)
function splitIntoScreens(questions) {
  const screenStarts = questions
    .map((q, i) => ({ newScreen: q.newScreen, i }))
    .filter(q => q.i === 0 || q.newScreen)
    .concat([{ i: questions.length }]);

  return screenStarts.slice(0, -1).map((q, i) => {
    const start = q.i;
    const end = screenStarts[i + 1].i;
    return questions.slice(start, end);
  });
}

export function readSurveyQuestions(data, survey) {
  const questions = data.map(importDataElement).filter(q => q.code);
  const screens = splitIntoScreens(questions);

  return screens.flatMap((x, i) =>
    makeScreen(x, {
      surveyId: survey.id,
      sheet: survey.name,
      screenIndex: i,
    }),
  );
}
