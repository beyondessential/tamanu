import React, { useState } from 'react';
import styled from 'styled-components';
import { object, string } from 'yup';

import { nonEmergencyDiagnosisCertaintyOptions } from '../constants';


import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import { FormSectionSeparator } from '../components/FormSectionSeparator';
import {
  Form,
  Field,
  SelectField,
  CheckField,
  TextField,
  AutocompleteField,
  DateField,
  RadioField,
} from '../components/Field';
import { Button } from '../components';
import { DIAGNOSIS_CERTAINTY } from '/shared/constants';

const DiagnosisFields = props => {
  return (
    <FormGrid columns={2}>
      <Field
        name={`diagnosisId${props.count}`}
        label="Diagnosis"
        component={AutocompleteField}
        suggester={props.icd10Suggester}
      />
      <Field
        name={`diagnosisCertainty${props.count}`}
        label="Certainty"
        inline
        component={RadioField}
        options={[
          { value: DIAGNOSIS_CERTAINTY.SUSPECTED, label: 'Suspected' },
          { value: DIAGNOSIS_CERTAINTY.CONFIRMED, label: 'Confirmed' },
        ]}
      />
    </FormGrid>
  );
};

const DiagnosesContainer = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
`;

const AddDiagnosisButton = styled(Button)`
  align-self: flex-start;
  margin-top: 10px;
`;

const ReferralFormSchema = object().shape({
  referralNumber: string().required('Referral number is required'),
  referredById: string().required('Referring doctor is required'),
  referredToDepartmentId: string().required('Department is required'),
  referredToFacilityId: string().required('Facility is required'),
});

export const ReferralForm = React.memo(
  ({
    onCancel,
    onSubmit,
    referral,
    icd10Suggester,
    practitionerSuggester,
    departmentSuggester,
    facilitySuggester,
  }) => {
    const [diagnosisCount, setDiagnosisCount] = useState(1);
    return (
      <Form
        onSubmit={onSubmit}
        validationSchema={ReferralFormSchema}
        initialValues={{
          date: new Date(),
          certainty: 'confirmed',
          ...referral,
        }}
        render={({ submitForm }) => (
          <FormGrid>
            <Field
              name="referralNumber"
              label="Referral number"
              component={TextField}
              style={{ gridColumn: '1/-1' }}
              required
            />
            <Field
              name="referredById"
              label="Referring doctor"
              component={AutocompleteField}
              suggester={practitionerSuggester}
              required
            />
            <Field name="date" label="Date" component={DateField} required />
            <FormSectionSeparator heading="Being referred to:" />
            <Field name="urgent" label="Urgent priority" component={CheckField} required />
            <Field
              name="referredToDepartmentId"
              label="Department"
              component={AutocompleteField}
              suggester={departmentSuggester}
              required
            />
            <Field
              name="referredToFacilityId"
              label="Facility"
              component={AutocompleteField}
              suggester={facilitySuggester}
              required
            />
            <FormSeparatorLine />
            <DiagnosesContainer>
              {Array(diagnosisCount)
                .fill()
                .map((_, index) => (
                  <DiagnosisFields key={index} count={index} icd10Suggester={icd10Suggester} />
                ))}
              <AddDiagnosisButton
                variant="outlined"
                color="primary"
                onClick={() => setDiagnosisCount(diagnosisCount + 1)}
              >
                Add Diagnosis
              </AddDiagnosisButton>
            </DiagnosesContainer>
            <Field
              name="reasonForReferral"
              label="Reason for referral"
              component={TextField}
              multiline
              style={{ gridColumn: '1 / -1' }}
              rows={4}
            />
            <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
          </FormGrid>
        )}
      />
    );
  },
);
