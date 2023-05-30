import { checkVisibility } from './survey';

const isVisible = (values, questionComponents) => component => {
  const result = checkVisibility(
    {
      visibilityCriteria: JSON.stringify(component.props.visibilityCriteria),
      dataElement: {},
    },
    values,
    questionComponents.map(x => ({
      dataElement: { id: x.props.name, name: x.props.name, code: x.props.name },
    })),
  );

  return result;
};

// Used with PaginatedForm
export const getVisibleQuestions = (questionComponents, values) =>
  // Adapt the questionComponents from react elements to the survey config objects which the
  // checkVisibility util expects
  questionComponents
    .filter(component => isVisible(values, questionComponents)(component))
    .map(x => ({ ...x, props: { ...x.props, key: x.props.name } }));

export const getInvisibleQuestions = (questionComponents, values) =>
  questionComponents
    .filter(component => !isVisible(values, questionComponents)(component))
    .map(x => ({ ...x, props: { ...x.props, key: x.props.name } }));
