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
        <Heading3 mb="12px">
          <TranslatedText
            stringId="lab.create.header"
            fallback="Creating a new lab request"
            data-testid='translatedtext-ux67' />
        </Heading3>
        <BodyText mb="28px" color="textTertiary">
          <TranslatedText
            stringId="lab.create.instruction"
            fallback="Please complete the details below and select the lab request type"
            data-testid='translatedtext-fojd' />
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
                  data-testid='translatedtext-vfzb' />
              ),
            }}
            data-testid='translatedtext-dsbd' />
        }
        required
        component={AutocompleteField}
        suggester={practitionerSuggester}
        data-testid='field-qjpc' />
      <Field
        name="requestedDate"
        label={
          <TranslatedText
            stringId="general.requestDateTime.label"
            fallback="Request date & time"
            data-testid='translatedtext-8u4g' />
        }
        required
        component={DateTimeField}
        saveDateAsString
        data-testid='field-liic' />
      <Field
        name="departmentId"
        label={<TranslatedText
          stringId="general.department.label"
          fallback="Department"
          data-testid='translatedtext-wmd1' />}
        component={AutocompleteField}
        suggester={departmentSuggester}
        data-testid='field-6vce' />
      <Field
        name="labTestPriorityId"
        label={<TranslatedText
          stringId="lab.priority.label"
          fallback="Priority"
          data-testid='translatedtext-k4j5' />}
        component={SuggesterSelectField}
        endpoint="labTestPriority"
        data-testid='field-pupp' />
      <FormSeparatorLine />
      <LabRequestFormTypeRadioField setFieldValue={setFieldValue} value={values.requestFormType} />
    </>
  );
};
