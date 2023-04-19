import { checkVisibility } from './survey';

// Used with PaginatedForm
export const getVisibleQuestions = (questionComponents, values) =>
  // Adapt the questionComponents from react elements to the survey config objects which the
  // checkVisibility util expects
  questionComponents.filter(c =>
    checkVisibility(
      {
        visibilityCriteria: JSON.stringify(c.props.visibilityCriteria),
        dataElement: {},
      },
      values,
      questionComponents.map(x => ({
        dataElement: { id: x.props.name, name: x.props.name, code: x.props.name },
      })),
    ),
  );
