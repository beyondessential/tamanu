import React from 'react';
import { Heading3, BodyText } from '../../components/Typography';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  FormSeparatorLine,
  SuggesterSelectField,
} from '../../components';
import { LabRequestFormTypeRadioField } from './LabRequestFormTypeRadioField';
import { TranslatedText } from '../../components/Translation/TranslatedText';

// If update any fields please update screen1ValidationSchema in LabRequestMultiStepForm.js
export const LabRequestFormScreen1 = ({
  setFieldValue,
  values,
  practitionerSuggester,
  departmentSuggester,
}) => {
  return (
    <>
      <div style={{ gridColumn: '1 / -1' }}>
        <Heading3 mb="12px" data-testid="heading3-aka8">
          <TranslatedText
            stringId="lab.create.header"
            fallback="Creating a new lab request"
            data-testid="translatedtext-lrkv"
          />
        </Heading3>
        <BodyText mb="28px" color="textTertiary" data-testid="bodytext-72np">
          <TranslatedText
            stringId="lab.create.instruction"
            fallback="Please complete the details below and select the lab request type"
            data-testid="translatedtext-rtj1"
          />
        </BodyText>
      </div>
      <Field
        name="requestedById"
        label={
          <TranslatedText
            stringId="lab.requestingClinician.label"
            fallback="Requesting :clinician"
            replacements={{
              clinician: (
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                  casing="lower"
                  data-testid="translatedtext-9ywn"
                />
              ),
            }}
            data-testid="translatedtext-3oko"
          />
        }
        required
        component={AutocompleteField}
        suggester={practitionerSuggester}
        data-testid="field-z6gb"
      />
      <Field
        name="requestedDate"
        label={
          <TranslatedText
            stringId="general.requestDateTime.label"
            fallback="Request date & time"
            data-testid="translatedtext-fey3"
          />
        }
        required
        component={DateTimeField}
        data-testid="field-y6ku"
      />
      <Field
        name="departmentId"
        label={
          <TranslatedText
            stringId="general.department.label"
            fallback="Department"
            data-testid="translatedtext-19pb"
          />
        }
        component={AutocompleteField}
        suggester={departmentSuggester}
        data-testid="field-wobc"
      />
      <Field
        name="labTestPriorityId"
        label={
          <TranslatedText
            stringId="lab.priority.label"
            fallback="Priority"
            data-testid="translatedtext-8z93"
          />
        }
        component={SuggesterSelectField}
        endpoint="labTestPriority"
        data-testid="field-lma4"
      />
      <FormSeparatorLine data-testid="formseparatorline-oupv" />
      <LabRequestFormTypeRadioField
        setFieldValue={setFieldValue}
        value={values.requestFormType}
        data-testid="labrequestformtyperadiofield-oi14"
      />
    </>
  );
};
