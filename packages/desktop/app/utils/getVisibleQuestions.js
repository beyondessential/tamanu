import { checkVisibility } from './survey';

const isVisible = (values, allQuestionComponents, component) => {
  const result = checkVisibility(
    {
      visibilityCriteria: JSON.stringify(component.props.visibilityCriteria),
      dataElement: {},
    },
    values,
    allQuestionComponents.map(x => ({
      dataElement: { id: x.props.name, name: x.props.name, code: x.props.name },
    })),
  );

  return result;
};

// Used with PaginatedForm
export const getVisibleQuestions = (allQuestionComponents, screenQuestionComponents, values) =>
  // Adapt the questionComponents from react elements to the survey config objects which the
  // checkVisibility util expects
  screenQuestionComponents
    .filter(component => isVisible(values, allQuestionComponents, component))
    .map(x => ({ ...x, props: { ...x.props, key: x.props.name } }));

export const getInvisibleQuestions = (allQuestionComponents, screenQuestionComponents, values) =>
  screenQuestionComponents
    .filter(component => !isVisible(values, allQuestionComponents, component))
    .map(x => ({ ...x, props: { ...x.props, key: x.props.name } }));
