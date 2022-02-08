import React from 'react';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';
import MuiBox from '@material-ui/core/Box';
import { FormGrid } from '../components/FormGrid';
import {
  Field,
  AutocompleteField,
  DateTimeField,
  DateField,
  RadioField,
  TextField,
  CheckField,
  NumberField,
  SelectField,
} from '../components/Field';
import { PaginatedForm, PaginatedFormActions } from '../components/Field/PaginatedForm';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import { Button, OutlinedButton } from '../components';

const binaryOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const binaryUnknownOptions = [...binaryOptions, { value: 'unknown', label: 'Unknown' }];

const ModalFooter = styled(MuiBox)`
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

  button ~ button {
    margin-left: 12px;
  }
`;

const RedHeading = styled(Typography)`
  font-weight: 500;
  font-size: 21px;
  line-height: 21px;
  color: #f76853;
`;

const Heading = styled(Typography)`
  font-weight: 500;
  font-size: 15px;
  line-height: 21px;
  color: #444444;
`;

const Text = styled(Typography)`
  font-size: 15px;
  line-height: 21px;
  color: #888888;
  margin-bottom: 30px;
`;

const ConfirmScreen = () => {
  return (
    <FormGrid columns={1}>
      <RedHeading>Confirm death record</RedHeading>
      <Heading>
        This action is irreversible. Are you sure you want to record the death of a patient?
      </Heading>
      <Text>
        This should only be done under the direction of the responsible clinician. Do you wish to
        proceed?
      </Text>
    </FormGrid>
  );
};

const PLACES = [
  'Home',
  'Residential institution',
  'School or other institution or public administrative area',
  'Sports or athletic area',
  'Street or highway',
  'Trade or service area',
  'Industrial or construction area',
  'Bush or reserve',
  'Farm',
];

const placeOptions = Object.values(PLACES).map(type => ({
  label: type,
  value: type,
}));

const MANNER_OF_DEATHS = [
  'Disease',
  'Assault',
  'Accident',
  'Legal Intervention',
  'Pending Investigation',
  'Intentional Self Harm',
  'War',
  'Unknown/Could not be determined',
];

const mannerOfDeathOptions = Object.values(MANNER_OF_DEATHS).map(type => ({
  label: type,
  value: type,
}));

/**
 * onCancel: closes modal
 * onSubmit: make api request
 */
export const DeathForm = React.memo(
  ({ onCancel, onSubmit, practitionerSuggester, icd10Suggester }) => {
    const renderFormActions = ({ onStepBack, onStepForward, screenIndex, isLast, submitForm }) => {
      if (screenIndex === 4) {
        return (
          <ModalFooter>
            <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
              Back
            </OutlinedButton>
            <Button color="primary" variant="contained" onClick={onStepForward}>
              Submit
            </Button>
          </ModalFooter>
        );
      }

      if (isLast) {
        return (
          <ModalFooter>
            <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
              Back
            </OutlinedButton>
            <MuiBox>
              <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
              <Button color="primary" variant="contained" onClick={submitForm}>
                Record Death
              </Button>
            </MuiBox>
          </ModalFooter>
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
            name="causeOfDeath"
            label="Cause Of Death"
            component={AutocompleteField}
            suggester={icd10Suggester}
            required
          />
          <Field
            name="causeOfDeathInterval"
            label="Time between onset and death"
            component={NumberField}
            required
          />
          <Field
            name="causeOfDeath2"
            label="Due to (or as a consequence of)"
            component={AutocompleteField}
            suggester={icd10Suggester}
          />
          <Field
            name="causeOfDeath2Interval"
            label="Time between onset and death"
            component={NumberField}
          />
          <FormSeparatorLine />
          <Field
            name="clinicianId"
            label="Attending Clinician"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field
            name="facilityId"
            label="Facility"
            component={AutocompleteField}
            suggester={practitionerSuggester}
          />
          <Field
            name="timeOfDeath"
            label="Date/Time"
            component={props => <DateTimeField {...props} InputProps={{}} />}
            required
          />
          <Field
            name="deathOutsideHealthFacility"
            label="Died outside health facility"
            component={CheckField}
          />
        </FormGrid>
        <FormGrid columns={1}>
          <Field
            name="surgeryInLast4Weeks"
            label="Was surgery performed in the last 4 weeks?"
            inline
            component={RadioField}
            options={binaryUnknownOptions}
          />
          <Field
            name="lastSurgeryDate"
            label="If yes, what was the date of surgery"
            component={DateTimeField}
          />
          <Field
            name="lastSurgeryReason"
            label="What was the reason for the surgery"
            component={AutocompleteField}
            suggester={icd10Suggester}
          />
        </FormGrid>
        <FormGrid columns={1}>
          <Field
            name="pregnant"
            label="If this was a woman, was the woman pregnant?"
            inline
            component={RadioField}
            options={binaryUnknownOptions}
          />
          <Field
            name="pregnancyContribute"
            label="Did the pregnancy contribute to the death?"
            inline
            component={RadioField}
            options={binaryUnknownOptions}
          />
        </FormGrid>
        <FormGrid columns={1}>
          <Field
            name="mannerOfDeath"
            label="What was the manner of death?"
            component={SelectField}
            options={mannerOfDeathOptions}
          />
          <Field
            name="mannerOfDeathDate"
            label="What date did this external cause occur?"
            component={DateField}
          />
          <Field
            name="mannerOfDeathLocation"
            label="Where did this external cause occur?"
            component={SelectField}
            options={placeOptions}
          />
          <Field name="mannerOfDeathOther" label="Other" component={TextField} />
        </FormGrid>
        <FormGrid columns={1}>
          <Field
            name="fetalOrInfant"
            label="Was the death fetal or infant?"
            component={RadioField}
            options={binaryOptions}
          />
          <Field
            name="stillborn"
            label="Was it a stillbirth?"
            component={RadioField}
            options={binaryUnknownOptions}
          />
          <Field name="birthWeight" label="Birth Weight (grams):" component={NumberField} />
          <Field
            name="numberOfCompletedPregnancyWeeks"
            label="Number of completed weeks of pregnancy:"
            component={NumberField}
          />
          <Field name="ageOfMother" label="Age of mother" component={NumberField} />
          <Field
            name="motherExistingCondition"
            label="Any condition in mother affecting the fetus or newborn?"
            component={AutocompleteField}
          />
          <Field
            name="deathWithin24HoursOfBirth"
            label="Was the death within 24 hours of birth?"
            component={RadioField}
            options={binaryOptions}
          />
          <Field
            name="numberOfHoursSurvivedSinceBirth"
            label="If yes, number of hours survived"
            component={NumberField}
          />
        </FormGrid>
        <ConfirmScreen />
      </PaginatedForm>
    );
  },
);
