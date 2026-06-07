import { PROGRAM_DATA_ELEMENT_TYPES, RESULT_COLORS } from '@tamanu/constants';
import { checkVisibilityCriteria } from '../fields';

const shouldShow = (component, components, valuesByCode) => {
  switch (component.dataElement.type) {
    case PROGRAM_DATA_ELEMENT_TYPES.DISPLAY_TEXT:
      // `checkVisibilityCriteria` could be called for all question types, but it’s redundant for
      // other question types. (A hidden question is always unanswered, which gets hidden anyway.)
      // DisplayText is a special case that’s expressly un-hidden, hence parsing visibilityCriteria.
      return checkVisibilityCriteria(component, components, valuesByCode);
    case PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION:
    case PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK:
      return false;
    default:
      return true;
  }
};

export const getDisplayTextAnswer = component => {
  const { text, detail, dataElement } = component;
  return [text || dataElement.defaultText, detail].filter(Boolean).join('\n') || undefined;
};

export const getSurveyAnswerRows = ({ components, answers }) => {
  const componentsByDataElementId = new Map(components.map(c => [c.dataElement.id, c]));
  const valuesByDataElementId = answers.reduce((acc, { dataElementId, body }) => {
    acc[dataElementId] = body;
    return acc;
  }, {});

  const valuesByCode = Object.entries(valuesByDataElementId).reduce((acc, [id, value]) => {
    const matchingComponent = componentsByDataElementId.get(id);
    if (matchingComponent) acc[matchingComponent.dataElement.code] = value;
    return acc;
  }, {});

  return components
    .map(component => {
      if (!shouldShow(component, components, valuesByCode)) return null;

      const { dataElement, id, screenIndex, config } = component;
      const { type: originalType, name } = dataElement;
      const answerObject = answers.find(a => a.dataElementId === dataElement.id);
      const answer =
        answerObject?.body ??
        (originalType === PROGRAM_DATA_ELEMENT_TYPES.DISPLAY_TEXT
          ? getDisplayTextAnswer(component)
          : undefined);
      const sourceType = answerObject?.sourceType;
      const sourceConfig = answerObject?.sourceConfig;
      const componentConfig =
        originalType === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER ? sourceConfig : config;
      const type =
        originalType === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER ? sourceType : originalType;

      return {
        id,
        type,
        answer,
        name,
        screenIndex,
        dataElementId: dataElement.id,
        config: componentConfig,
        originalBody: answerObject?.originalBody,
      };
    })
    .filter(row => row != null);
};

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
