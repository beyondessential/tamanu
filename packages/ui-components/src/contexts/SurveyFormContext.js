import { createContext, useContext } from 'react';

export const SurveyFormContext = createContext({
  getComponentForQuestionType: () => {},
});

export const useSurveyForm = () => {
  const context = useContext(SurveyFormContext);
  if (!context) {
    throw new Error('useSurveyForm has been called outside a SurveyFormProvider.');
  }
  return context;
};
