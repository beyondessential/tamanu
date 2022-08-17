import { makeRecord, yesOrNo } from './index';

function newlinesToArray(data) {
  if (!data)
    return null;

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
function makeScreen(questions, componentData) {
  return questions
    .map((component, i) => {
      const {
        visibilityCriteria = '', validationCriteria = '', detail = '', config: qConfig = '', calculation = '', row, ...elementData
      } = component;

      const { surveyId, sheet, ...otherComponentData } = componentData;

      const dataElement = makeRecord(
        'programDataElement',
        {
          id: `pde-${elementData.code}`,
          defaultOptions: '',
          ...elementData,
        },
        sheet,
        row
      );

      const surveyScreenComponent = makeRecord(
        'surveyScreenComponent',
        {
          id: `${surveyId}-${elementData.code}`,
          dataElementId: dataElement.data.id,
          surveyId,
          text: '',
          options: '',
          componentIndex: i,
          visibilityCriteria,
          validationCriteria,
          detail,
          config: qConfig,
          calculation,
          ...otherComponentData,
        },
        sheet,
        row
      );

      return [dataElement, surveyScreenComponent];
    })
    .flat();
}
function importDataElement(row) {
  const { newScreen, options, optionLabels, text, ...rest } = row;

  return {
    newScreen: yesOrNo(newScreen),
    defaultOptions: options,
    optionLabels: newlinesToArray(optionLabels),
    defaultText: text,
    row: row.__rowNum__ + 1,
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
export function importSurveySheet(data, survey) {
  const questions = data.map(importDataElement).filter(q => q.code);
  const screens = splitIntoScreens(questions);

  return screens
    .map((x, i) => makeScreen(x, {
      surveyId: survey.id,
      sheet: survey.name,
      screenIndex: i,
    })
    )
    .flat();
}
