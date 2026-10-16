import React from 'react';

import { PatientSurveyForm } from '@tamanu/ui-components';

import { getKioskComponentForQuestionType } from './kioskQuestions';

/** One kiosk form, page by page. Remount it (by `key`) to open a different form. */
export const KioskSurveyForm = props => (
  <PatientSurveyForm
    {...props}
    getComponentForQuestionType={getKioskComponentForQuestionType}
    testIdPrefix="kiosk-form"
  />
);
