import React, { useState } from 'react';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';
import MuiBox from '@material-ui/core/Box';
import { FormGrid } from '../components/FormGrid';
import {
  Field,
  AutocompleteField,
  DateTimeField,
  RadioField,
  TextField,
} from '../components/Field';
import { PaginatedForm, PaginatedFormActions } from '../components/Field/PaginatedForm';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import { Button, DeleteButton, Modal, OutlinedButton } from '../components';
import { ContentPane } from '../components/ContentPane';
import { ConfirmAdministeredVaccineDelete } from '../components/ConfirmAdministeredVaccineDelete';

const binaryOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Unknown' },
];

const Box = styled(MuiBox)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 24px;
  margin-left: -32px;
  margin-right: -32px;
  margin-bottom: -6px;
  padding-left: 32px;
  padding-right: 32px;
  border-top: 1px solid #dedede;
`;

/**
 * onCancel: closes modal
 * onSubmit: make api request
 */
export const DeathForm = React.memo(
  ({ onCancel, onSubmit, practitionerSuggester, icd10Suggester }) => {
    const [confirmSubmit, setConfirmSubmit] = useState(false);

    const handleUnConfirmedSubmit = () => {
      console.log('unconfirmed submit...');
      setConfirmSubmit(true);
    };

    const handleConfirmedSubmit = () => {
      console.log('confirmed submit...');
      onSubmit();
      setConfirmSubmit(false);
    };

    if (confirmSubmit) {
      return (
        <ContentPane>
          <h3>
            This action is irreversible. Are you sure you want to record the death of a patient?{' '}
          </h3>
          <p>
            This should only be done under the direction of the responsible clinician. Do you wish
            to proceed?
          </p>

          <Button onClick={() => setConfirmSubmit(false)} variant="contained" color="primary">
            Back
          </Button>
          <OutlinedButton onClick={handleConfirmedSubmit} variant="contained" color="primary">
            Record death
          </OutlinedButton>
        </ContentPane>
      );
    }

    return (
      <PaginatedForm
        onSubmit={handleUnConfirmedSubmit}
        initialValues={{
          date: new Date(),
        }}
      >
        <FormGrid>
          <Field
            name="causeOfDeath.id"
            label="Cause Of Death"
            component={AutocompleteField}
            suggester={icd10Suggester}
            required
          />
          <Field
            name="timeFromCauseToDeath"
            label="Time between onset and death"
            component={DateTimeField}
            required
          />
          <Field
            name="consequencesOfDeath.id"
            label="Due to (or as a consequence of)"
            component={AutocompleteField}
            suggester={icd10Suggester}
            required
          />
          <Field
            name="timeFromConsequenceToDeath"
            label="Time between onset and death"
            component={DateTimeField}
            required
          />
          <FormSeparatorLine />
          <Field
            name="clinician.id"
            label="Attending Clinician"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field
            name="facility.id"
            label="Facility"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field name="date" label="Date/Time" component={DateTimeField} required />
        </FormGrid>
        <FormGrid columns={1}>
          <Field
            name="surgery"
            label="Was surgery performed in the last 4 weeks?"
            inline
            component={RadioField}
            options={binaryOptions}
          />
          <Field
            name="dateOfSurgery"
            label="If yes, what was the date of surgery"
            component={DateTimeField}
          />
          <Field
            name="reasonForSurgery.id"
            label="What was the reason for the surgery"
            component={AutocompleteField}
            suggester={icd10Suggester}
            required
          />
        </FormGrid>
        <FormGrid columns={1}>
          <Field
            name="pregnant"
            label="If this was a woman, was the woman pregnant?"
            inline
            component={RadioField}
            options={binaryOptions}
          />
          <Field
            name="pregnantContribute"
            label="Did the pregnancy contribute to the death?"
            inline
            component={RadioField}
            options={binaryOptions}
          />
        </FormGrid>
        <FormGrid columns={1}>
          <Field name="mannerOfDeath" label="What was the manner of death?" component={TextField} />
        </FormGrid>
        <FormGrid columns={1}>
          <Field
            name="fetalOrInfant"
            label="Was the death fetal or infant?"
            component={RadioField}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
          />
        </FormGrid>
      </PaginatedForm>
    );
  },
);
