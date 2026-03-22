import { checkVisibility } from '@tamanu/ui-components';

const isVisible = (values, allQuestionReactElements, reactElement) => {
  const result = checkVisibility(
    {
      visibilityCriteria: JSON.stringify(reactElement.props.visibilityCriteria),
      dataElement: {},
    },
    values,
    allQuestionReactElements.map((x) => ({
      dataElement: { id: x.props.name, name: x.props.name, code: x.props.name },
    })),
  );

  return result;
};

// Used with PaginatedForm
export const getVisibleQuestions = (
  values,
  allQuestionReactElements,
  screenQuestionReactElements = allQuestionReactElements,
) =>
  // Adapt the questionReactElements from react elements to the survey config objects which the
  // checkVisibility util expects
  screenQuestionReactElements
    .filter((reactElement) => isVisible(values, allQuestionReactElements, reactElement))
    .map((x) => ({ ...x, props: { ...x.props, key: x.props.name } }));

export const getInvisibleQuestions = (
  values,
  allQuestionReactElements,
  screenQuestionReactElements = allQuestionReactElements,
) =>
  screenQuestionReactElements
    .filter((reactElement) => !isVisible(values, allQuestionReactElements, reactElement))
    .map((x) => ({ ...x, props: { ...x.props, key: x.props.name } }));
