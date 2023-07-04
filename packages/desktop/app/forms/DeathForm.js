import React, { useState } from 'react';
import * as yup from 'yup';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';
import { differenceInYears, differenceInMonths } from 'date-fns';
import MuiBox from '@material-ui/core/Box';
import { MANNER_OF_DEATHS, MANNER_OF_DEATH_OPTIONS } from 'shared/constants';
import {
  ArrayField,
  Button,
  OutlinedButton,
  Field,
  FieldWithTooltip,
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
  FormGrid,
  FormSeparatorLine,
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
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
  margin-bottom: 48px;
`;

const BaseConfirmScreen = ({
  heading,
  text,
  onStepBack,
  onCancel,
  onContinue,
  continueButtonText,
}) => (
  <FormGrid columns={1}>
    <RedHeading>{heading}</RedHeading>
    <Text>{text}</Text>
    <Actions>
      <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
        Back
      </OutlinedButton>
      <MuiBox>
        <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
        <Button color="primary" variant="contained" onClick={onContinue}>
          {continueButtonText}
        </Button>
      </MuiBox>
    </Actions>
  </FormGrid>
);

const ConfirmScreen = ({ onStepBack, submitForm, onCancel }) => (
  <BaseConfirmScreen
    heading="Confirm death record"
    text="This action is irreversible. This should only be done under the direction
      of the responsible clinician. Do you wish to record the death of this patient?"
    continueButtonText="Record death"
    onStepBack={onStepBack}
    onContinue={submitForm}
    onCancel={onCancel}
  />
);

const DoubleConfirmScreen = ({ onStepBack, submitForm, onCancel }) => {
  const [dischargeConfirmed, setDischargeConfirmed] = useState(false);

  if (!dischargeConfirmed) {
    return (
      <BaseConfirmScreen
        heading="Patient will be auto-discharged and locked"
        text="This patient has an active encounter. Please ensure that all
          encounter details are up-to-date and correct before proceeding."
        continueButtonText="Continue"
        onStepBack={onStepBack}
        onContinue={() => {
          setDischargeConfirmed(true);
        }}
        onCancel={onCancel}
      />
    );
  }
  return (
    <ConfirmScreen
      onStepBack={() => {
        setDischargeConfirmed(false);
      }}
      submitForm={submitForm}
      onCancel={onCancel}
    />
  );
};

const StyledFormGrid = styled(FormGrid)`
  min-height: 200px;
`;

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

const mannerOfDeathVisibilityCriteria = {
  mannerOfDeath: MANNER_OF_DEATHS.filter(x => x !== 'Disease'),
};

export const DeathForm = React.memo(
  ({
    onCancel,
    onSubmit,
    patient,
    hasCurrentEncounter,
    practitionerSuggester,
    icd10Suggester,
    facilitySuggester,
  }) => {
    const patientYearsOld = differenceInYears(new Date(), patient.dateOfBirth);
    const isAdultFemale = patient.sex === 'female' && patientYearsOld >= 12;

    const patientMonthsOld = differenceInMonths(new Date(), patient.dateOfBirth);
    const isInfant = patientMonthsOld <= 2;

    return (
      <PaginatedForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        SummaryScreen={hasCurrentEncounter ? DoubleConfirmScreen : ConfirmScreen}
        validationSchema={yup.object().shape({
          causeOfDeath: yup.string().required(),
          causeOfDeathInterval: yup
            .string()
            .required()
            .label('Time between onset and death'),
          clinicianId: yup
            .string()
            .required()
            .label('Attending clinician'),
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
        initialValues={{
          outsideHealthFacility: false,
        }}
      >
        <StyledFormGrid columns={2}>
          <FieldWithTooltip
            name="causeOfDeath"
            label="Cause Of Death"
            component={AutocompleteField}
            suggester={icd10Suggester}
            tooltipText="This does not mean the mode of dying (e.g heart failure, respiratory failure). It means the disease, injury or complication that caused the death."
            required
          />
          <Field
            name="causeOfDeathInterval"
            label="Time between onset and death"
            component={TimeWithUnitField}
            required
          />
          <Field
            name="antecedentCause1"
            label="Due to (or as a consequence of)"
            component={AutocompleteField}
            suggester={icd10Suggester}
          />
          <Field
            name="antecedentCause1Interval"
            label="Time between onset and death"
            component={TimeWithUnitField}
          />
          <Field
            name="antecedentCause2"
            label="Due to (or as a consequence of)"
            component={AutocompleteField}
            suggester={icd10Suggester}
          />
          <Field
            name="antecedentCause2Interval"
            label="Time between onset and death"
            component={TimeWithUnitField}
          />
          <FormSeparatorLine />
          <Field
            name="otherContributingConditions"
            component={ArrayField}
            renderField={(index, DeleteButton) => (
              <>
                <Field
                  name={`otherContributingConditions[${index}].cause`}
                  label="Other contributing condition"
                  component={AutocompleteField}
                  suggester={icd10Suggester}
                />
                <MuiBox display="flex" alignItems="center">
                  <Field
                    name={`otherContributingConditions[${index}].interval`}
                    label="Time between onset and death"
                    component={TimeWithUnitField}
                  />
                  {index > 0 && DeleteButton}
                </MuiBox>
              </>
            )}
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
            name="timeOfDeath"
            label="Date/Time"
            component={props => <DateTimeField {...props} InputProps={{}} />}
            saveDateAsString
            required
          />
          <Field
            name="facilityId"
            label="Facility"
            component={AutocompleteField}
            suggester={facilitySuggester}
          />
          <Field
            name="outsideHealthFacility"
            label="Died outside health facility"
            component={CheckField}
            style={{ gridColumn: '1/-1', marginBottom: '10px', marginTop: '5px' }}
          />
        </StyledFormGrid>
        <StyledFormGrid columns={1}>
          <Field
            name="surgeryInLast4Weeks"
            label="Was surgery performed in the last 4 weeks?"
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
        </StyledFormGrid>
        {isAdultFemale ? (
          <StyledFormGrid columns={1}>
            <Field
              name="pregnant"
              label="Was the woman pregnant?"
              component={RadioField}
              options={binaryUnknownOptions}
            />
            <Field
              name="pregnancyContribute"
              label="Did the pregnancy contribute to the death?"
              component={RadioField}
              options={binaryUnknownOptions}
              visibilityCriteria={{ pregnant: 'yes' }}
            />
          </StyledFormGrid>
        ) : null}
        <StyledFormGrid columns={1}>
          <Field
            name="mannerOfDeath"
            label="What was the manner of death?"
            component={SelectField}
            options={MANNER_OF_DEATH_OPTIONS}
            required
          />
          <Field
            name="mannerOfDeathDate"
            label="What date did this external cause occur?"
            component={DateField}
            saveDateAsString
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
        </StyledFormGrid>
        {isInfant ? (
          <StyledFormGrid columns={1}>
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
          </StyledFormGrid>
        ) : null}
      </PaginatedForm>
    );
  },
);
