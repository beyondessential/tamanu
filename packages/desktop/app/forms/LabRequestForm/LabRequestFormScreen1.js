import React from 'react';
import { Heading3, BodyText } from '../../components/Typography';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  FormSeparatorLine,
  SuggesterSelectField,
  useLocalisedText,
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
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });

  return (
    <>
      <div style={{ gridColumn: '1 / -1' }}>
        <Heading3 mb="12px">
          <TranslatedText stringId="lab.form.create.header" fallback="Creating a new lab request" />
        </Heading3>
        <BodyText mb="28px" color="textTertiary">
          <TranslatedText
            stringId="lab.form.create.instruction"
            fallback="Please complete the details below and select the lab request type"
          />
        </BodyText>
      </div>
      <Field
        name="requestedById"
        label={
          <TranslatedText
            stringId="lab.form.requestingClinician.label"
            fallback="Requesting :clinician"
            replacements={{ clinician: clinicianText.toLowerCase() }}
          />
        }
        required
        component={AutocompleteField}
        suggester={practitionerSuggester}
      />
      <Field
        name="requestedDate"
        label=<TranslatedText
          stringId="lab.form.requestDateTime.label"
          fallback="Request date & time"
        />
        required
        component={DateTimeField}
        saveDateAsString
      />
      <Field
        name="departmentId"
        label=<TranslatedText stringId="lab.form.department.label" fallback="Department" />
        component={AutocompleteField}
        suggester={departmentSuggester}
      />
      <Field
        name="labTestPriorityId"
        label=<TranslatedText stringId="lab.form.priority.label" fallback="Priority" />
        component={SuggesterSelectField}
        endpoint="labTestPriority"
      />
      <FormSeparatorLine />
      <LabRequestFormTypeRadioField setFieldValue={setFieldValue} value={values.requestFormType} />
    </>
  );
};
