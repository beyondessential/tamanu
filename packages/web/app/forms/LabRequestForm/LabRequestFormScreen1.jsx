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
            data-test-id='translatedtext-ux67' />
        </Heading3>
        <BodyText mb="28px" color="textTertiary">
          <TranslatedText
            stringId="lab.create.instruction"
            fallback="Please complete the details below and select the lab request type"
            data-test-id='translatedtext-fojd' />
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
                  data-test-id='translatedtext-vfzb' />
              ),
            }}
            data-test-id='translatedtext-dsbd' />
        }
        required
        component={AutocompleteField}
        suggester={practitionerSuggester}
        data-test-id='field-qjpc' />
      <Field
        name="requestedDate"
        label={
          <TranslatedText
            stringId="general.requestDateTime.label"
            fallback="Request date & time"
            data-test-id='translatedtext-8u4g' />
        }
        required
        component={DateTimeField}
        saveDateAsString
        data-test-id='field-liic' />
      <Field
        name="departmentId"
        label={<TranslatedText
          stringId="general.department.label"
          fallback="Department"
          data-test-id='translatedtext-wmd1' />}
        component={AutocompleteField}
        suggester={departmentSuggester}
        data-test-id='field-6vce' />
      <Field
        name="labTestPriorityId"
        label={<TranslatedText
          stringId="lab.priority.label"
          fallback="Priority"
          data-test-id='translatedtext-k4j5' />}
        component={SuggesterSelectField}
        endpoint="labTestPriority"
        data-test-id='field-pupp' />
      <FormSeparatorLine />
      <LabRequestFormTypeRadioField setFieldValue={setFieldValue} value={values.requestFormType} />
    </>
  );
};
