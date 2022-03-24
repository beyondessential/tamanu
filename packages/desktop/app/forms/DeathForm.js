import React from 'react';
import * as yup from 'yup';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';
import moment from 'moment';
import MuiBox from '@material-ui/core/Box';
import { FormGrid } from '../components/FormGrid';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import {
  Button,
  OutlinedButton,
  Field,
  AutocompleteField,
  DateTimeField,
  DateField,
  RadioField,
  TextField,
  CheckField,
  NumberField,
  SelectField,
  TimeWithUnitField,
  PaginatedForm,
} from '../components';

const binaryOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const binaryUnknownOptions = [...binaryOptions, { value: 'unknown', label: 'Unknown' }];

const Actions = styled(MuiBox)`
  display: flex;
  justify-content: space-between;
  align-items: center;

  button ~ button {
    margin-left: 12px;
  }
`;

const RedHeading = styled(Typography)`
  font-size: 18px;
  line-height: 21px;
  font-weight: 500;
  color: ${props => props.theme.palette.error.main};
`;

const Text = styled(Typography)`
  font-size: 15px;
  line-height: 21px;
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
  margin-bottom: 48px;
`;

const ConfirmScreen = ({ onStepBack, submitForm, onCancel }) => (
  <FormGrid columns={1}>
    <RedHeading>Confirm death record</RedHeading>
    <Text>
      This action is irreversible. Are you sure you want to record the death of a patient? This
      should only be done under the direction of the responsible clinician. Do you wish to proceed?
    </Text>
    <Actions>
      <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
        Back
      </OutlinedButton>
      <MuiBox>
        <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
        <Button color="primary" variant="contained" onClick={submitForm}>
          Record Death
        </Button>
      </MuiBox>
    </Actions>
  </FormGrid>
);

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
  'Other',
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

const mannerOfDeathVisibilityCriteria = {
  mannerOfDeath: MANNER_OF_DEATHS.filter(x => x !== 'Disease'),
};

/**
 * onCancel: closes modal
 * onSubmit: make api request
 */
export const DeathForm = React.memo(
  ({ onCancel, onSubmit, patient, practitionerSuggester, icd10Suggester, facilitySuggester }) => {
    const patientYearsOld = moment().diff(patient.dateOfBirth, 'years');
    const isAdultFemale = patient.sex === 'female' && patientYearsOld >= 12;

    const patientMonthsOld = moment().diff(patient.dateOfBirth, 'months');
    const isInfant = patientMonthsOld <= 2;

    return (
      <PaginatedForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        SummaryScreen={ConfirmScreen}
        validationSchema={yup.object().shape({
          causeOfDeath: yup.string().required(),
          causeOfDeathInterval: yup.string().required(),
          clinicianId: yup.string().required(),
          lastSurgeryDate: yup
            .date()
            .max(yup.ref('timeOfDeath'), "Date of last surgery can't be after time of death"),
          mannerOfDeathDate: yup
            .date()
            .max(yup.ref('timeOfDeath'), "Manner of death date can't be after time of death"),
          timeOfDeath: yup
            .date()
            .min(patient.dateOfBirth, "Time of death can't be before date of birth")
            .required(),
        })}
      >
        <FormGrid columns={2}>
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
            component={TimeWithUnitField}
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
            component={TimeWithUnitField}
          />
          <FormSeparatorLine />
          <Field
            name="otherContributingConditions"
            label="Other contributing conditions"
            component={AutocompleteField}
            suggester={icd10Suggester}
          />
          <Field
            name="otherContributingConditionsInterval"
            label="Time between onset and death"
            component={TimeWithUnitField}
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
            suggester={facilitySuggester}
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
            label="What was the date of surgery"
            component={DateTimeField}
            visibilityCriteria={{ surgeryInLast4Weeks: 'yes' }}
          />
          <Field
            name="lastSurgeryReason"
            label="What was the reason for the surgery"
            component={AutocompleteField}
            suggester={icd10Suggester}
            visibilityCriteria={{ surgeryInLast4Weeks: 'yes' }}
          />
        </FormGrid>
        {isAdultFemale ? (
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
        ) : null}
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
            visibilityCriteria={mannerOfDeathVisibilityCriteria}
          />
          <Field
            name="mannerOfDeathLocation"
            label="Where did this external cause occur?"
            component={SelectField}
            options={placeOptions}
            visibilityCriteria={mannerOfDeathVisibilityCriteria}
          />
          <Field
            name="mannerOfDeathOther"
            label="Other"
            component={TextField}
            visibilityCriteria={{ mannerOfDeathLocation: 'Other' }}
          />
        </FormGrid>
        {isInfant ? (
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
              suggester={icd10Suggester}
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
        ) : null}
      </PaginatedForm>
    );
  },
);
