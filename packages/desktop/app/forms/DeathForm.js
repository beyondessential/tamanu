import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import MuiBox from '@material-ui/core/Box';
import { MANNER_OF_DEATHS, MANNER_OF_DEATH_OPTIONS } from 'shared/constants';
import { ageInMonths, ageInYears, getCurrentDateTimeString } from 'shared/utils/dateTime';
import {
  ArrayField,
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
import { useAuth } from '../contexts/Auth';
import { DeathFormScreen } from './DeathFormScreen';
import { SummaryScreenThree, SummaryScreenTwo } from './DeathFormSummaryScreens';

const binaryOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const binaryUnknownOptions = [...binaryOptions, { value: 'unknown', label: 'Unknown' }];

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
    deathData,
    practitionerSuggester,
    icd10Suggester,
    facilitySuggester,
  }) => {
    const { currentUser } = useAuth();
    const canBePregnant = patient.sex === 'female' && ageInYears(patient.dateOfBirth) >= 12;
    const isInfant = ageInMonths(patient.dateOfBirth) <= 2;

    return (
      <PaginatedForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        FormScreen={DeathFormScreen}
        SummaryScreen={deathData ? SummaryScreenTwo : SummaryScreenThree}
        validationSchema={yup.object().shape({
          causeOfDeath: yup.string().when('isPartialWorkflow', {
            is: undefined,
            then: yup.string().required(),
          }),
          causeOfDeathInterval: yup.string().when('isPartialWorkflow', {
            is: undefined,
            then: yup
              .string()
              .required()
              .label('Time between onset and death'),
          }),
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
          timeOfDeath: patient?.dateOfDeath || getCurrentDateTimeString(),
          clinicianId: deathData?.clinicianId || currentUser.id,
        }}
      >
        <StyledFormGrid columns={1}>
          <Field
            name="timeOfDeath"
            label="Date/Time"
            component={props => <DateTimeField {...props} InputProps={{}} />}
            saveDateAsString
            required
          />
          <Field
            name="clinicianId"
            label="Attending Clinician"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
        </StyledFormGrid>
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
            component={DateField}
            saveDateAsString
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
        {canBePregnant ? (
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
