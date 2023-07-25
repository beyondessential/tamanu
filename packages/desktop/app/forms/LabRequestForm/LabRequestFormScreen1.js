import React from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/shared/constants/labs';
import { Heading3, BodyText } from '../../components/Typography';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  FormSeparatorLine,
  SuggesterSelectField,
  useLocalisedText,
} from '../../components';
import { foreignKey } from '../../utils/validation';
import { LabRequestFormTypeRadioField } from './LabRequestFormTypeRadioField';

export const screen1ValidationSchema = yup.object().shape({
  requestedById: foreignKey('Requesting clinician is required'),
  requestedDate: yup.date().required('Request date is required'),
  requestFormType: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_FORM_TYPES))
    .required('Request type must be selected'),
});

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
        <Heading3 mb="12px">Creating a new lab request</Heading3>
        <BodyText mb="28px" color="textTertiary">
          Please complete the details below and select the lab request type
        </BodyText>
      </div>
      <Field
        name="requestedById"
        label={`Requesting ${clinicianText.toLowerCase()}`}
        required
        component={AutocompleteField}
        suggester={practitionerSuggester}
      />
      <Field
        name="requestedDate"
        label="Request date & time"
        required
        component={DateTimeField}
        saveDateAsString
      />
      <Field
        name="departmentId"
        label="Department"
        component={AutocompleteField}
        suggester={departmentSuggester}
      />
      <Field
        name="labTestPriorityId"
        label="Priority"
        component={SuggesterSelectField}
        endpoint="labTestPriority"
      />
      <FormSeparatorLine />
      <LabRequestFormTypeRadioField setFieldValue={setFieldValue} value={values.requestFormType} />
    </>
  );
};
