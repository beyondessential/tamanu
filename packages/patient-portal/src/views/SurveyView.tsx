import React from 'react';
import {
  SettingsContext,
  TranslationContext,
  SurveyQuestion,
  SurveyFormContext,
  LimitedTextField,
  MultilineTextField,
  BaseSelectField,
  BaseMultiselectField,
  ReadOnlyTextField,
} from '@tamanu/ui-components';
import { ENCOUNTER_TYPES, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { Card } from '@components/Card';
import { useCurrentUser } from '@routes/PrivateRoute';
import testData from '../testData.json';

const PlaceholderField = ({ label, helperText }) => (
  <p>
    {label} {helperText}
  </p>
);

const QUESTION_COMPONENTS = {
  [PROGRAM_DATA_ELEMENT_TYPES.TEXT]: LimitedTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTILINE]: MultilineTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.RADIO]: BaseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.SELECT]: BaseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT]: BaseMultiselectField,
  [PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.BINARY]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.CALCULATED]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_RESULT]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.USER_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.PHOTO]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.RESULT]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_TYPE]: PlaceholderField,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_SUBTYPE]: PlaceholderField,
};

function getComponentForQuestionType(type) {
  return QUESTION_COMPONENTS[type];
}

const getTranslation = value => value;

export const SurveyView = () => {
  const patient = useCurrentUser();
  return (
    <Card sx={{ width: '425px' }}>
      <TranslationContext.Provider value={{ getTranslation }}>
        <SettingsContext.Provider value={{}}>
          <SurveyFormContext.Provider value={{ getComponentForQuestionType }}>
            {testData.map(component => {
              console.log('testData', component);
              return (
                <SurveyQuestion
                  key={component.id}
                  component={component}
                  patient={patient}
                  inputRef={() => {}}
                  encounterType={ENCOUNTER_TYPES.ADMISSION}
                />
              );
            })}
          </SurveyFormContext.Provider>
        </SettingsContext.Provider>
      </TranslationContext.Provider>
    </Card>
  );
};
