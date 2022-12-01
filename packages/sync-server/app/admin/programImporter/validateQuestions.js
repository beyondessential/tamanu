import { ValidationError } from '../errors';

// Currently only used to validate required vitals survey questions exist
export const validateQuestions = (surveyContext, questions, criteria = {}) => {
  let returnValue = true;
  if (criteria.requiredFields) {
    for (const field of criteria.requiredFields) {
      if (!questions.find(q => q.id === field)) {
        returnValue = false;
        surveyContext.errors.push(
          new ValidationError(
            surveyContext.name,
            -1,
            `Survey "${surveyContext.name}" import missing required field: ${field}`,
          ),
        );
      }
    }
  }
  return returnValue;
};
