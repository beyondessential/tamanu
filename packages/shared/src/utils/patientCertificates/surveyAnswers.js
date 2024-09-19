const shouldShow = component => {
  switch (component.dataElement.type) {
    case 'Instruction':
      return false;
    case 'SurveyLink':
      return false;
    default:
      return true;
  }
};

export const getSurveyAnswerRows = ({ components, answers }) =>
  components
    .filter(shouldShow)
    .map(component => {
      const { dataElement, id, screenIndex } = component;
      const { type, name } = dataElement;
      const answerObject = answers.find(a => a.dataElementId === dataElement.id);
      const answer = answerObject?.body;
      return {
        id,
        type,
        answer,
        name,
        screenIndex,
      };
    })
    .filter(r => r.answer !== undefined);

const COLORS = {
  green: '#83d452',
  yellow: '#ffea5a',
  orange: '#fe8c00',
  red: '#ff2222',
  deepred: '#971a1a',
  purple: '#971a1a',
};

export const separateColorText = resultText => {
  for (const [key, color] of Object.entries(COLORS)) {
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

export const getResultName = (components) => {
  const resultComponent = components.find(component => component.dataElement.type === 'Result');
  return resultComponent?.dataElement.defaultText;
};
