import { createPatientFormQuestionTypes, toPatientForm } from '@tamanu/ui-components';

import { SurveyQuestionAutocompleteField } from '../../../components/Field';

/** The kiosk supports the shared patient form questions, searching with the web's own field. */
export const {
  isSupportedQuestionType: isKioskQuestionType,
  getComponentForQuestionType: getKioskComponentForQuestionType,
} = createPatientFormQuestionTypes({ AutocompleteQuestion: SurveyQuestionAutocompleteField });

export const toKioskForm = survey => toPatientForm(survey, isKioskQuestionType);
