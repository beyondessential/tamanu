import { PROGRAM_DATA_ELEMENT_TYPES, RESULT_COLORS } from '@tamanu/constants';

const shouldShow = component => {
  switch (component.dataElement.type) {
    case PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION:
      return false;
    case PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK:
      return false;
    default:
      return true;
  }
};

export const getSurveyAnswerRows = ({ components, answers }) =>
  components
    .filter(shouldShow)
    .map(component => {
      const { dataElement, id, screenIndex, config } = component;
      const { type, name } = dataElement;
      const answerObject = answers.find(a => a.dataElementId === dataElement.id);
      const answer = answerObject?.body;
      const sourceType = answerObject?.sourceType;
      return {
        id,
        type,
        answer,
        name,
        screenIndex,
        sourceType,
        dataElementId: dataElement.id,
        config,
        originalBody: answerObject?.originalBody,
      };
    })
    .filter(r => r.answer !== undefined);

export const separateColorText = resultText => {
  for (const [key, color] of Object.entries(RESULT_COLORS)) {
    // only match colors at the end that follow a result
    // "90% GREEN" -> "90%"
    // "blue ribbon" -> "blue ribbon"
    // "reduced risk" -> "reduced risk"
    const re = RegExp(` ${key}$`, 'i');
    if (resultText.match(re)) {
      const strippedResultText = resultText.replace(re, '').trim();
      return { color, strippedResultText };
    }
  }
  return {
    strippedResultText: resultText,
  };
};

export const getResultName = components => {
  const resultComponent = components.find(component => component.dataElement.type === 'Result');
  return resultComponent?.dataElement.defaultText;
};
