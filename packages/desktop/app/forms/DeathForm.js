import React from 'react';
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
import { Button, OutlinedButton } from '../components';

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
    const renderFormActions = ({ onStepBack, onStepForward, screenIndex, isLast }) => {
      if (screenIndex === 4) {
        return (
          <Box>
            <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
              Back
            </OutlinedButton>
            <Button color="primary" variant="contained" onClick={onStepForward}>
              Submit
            </Button>
          </Box>
        );
      }

      if (isLast) {
        return (
          <Box>
            <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
              Back
            </OutlinedButton>
            <Box>
              <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
              <Button color="primary" variant="contained" onClick={onSubmit}>
                Record Death
              </Button>
            </Box>
          </Box>
        );
      }

      return (
        <PaginatedFormActions
          onStepBack={onStepBack}
          onStepForward={onStepForward}
          screenIndex={screenIndex}
        />
      );
    };

    return (
      <PaginatedForm
        onSubmit={onSubmit}
        renderFormActions={renderFormActions}
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
        <FormGrid columns={1}>
          <Typography>
            <strong>
              This action is irreversible. Are you sure you want to record the death of a patient?
            </strong>
          </Typography>
          <Typography>
            This should only be done under the direction of the responsible clinician. Do you wish
            to proceed?
          </Typography>
        </FormGrid>
      </PaginatedForm>
    );
  },
);
