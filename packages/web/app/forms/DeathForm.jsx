import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import MuiBox from '@material-ui/core/Box';
import { MANNER_OF_DEATHS, PLACE_OF_DEATHS } from '@tamanu/constants';
import { ageInMonths, ageInYears, getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  ArrayField,
  AutocompleteField,
  CheckField,
  DateField,
  DateTimeField,
  Field,
  FieldWithTooltip,
  FormGrid,
  FormSeparatorLine,
  NumberField,
  PaginatedForm,
  RadioField,
  TextField,
  TimeWithUnitField,
  TranslatedSelectField,
} from '../components';
import { useAuth } from '../contexts/Auth';
import { DeathFormScreen } from './DeathFormScreen';
import { SummaryScreenThree, SummaryScreenTwo } from './DeathFormSummaryScreens';
import { BINARY_OPTIONS, BINARY_UNKNOWN_OPTIONS, FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';

const StyledFormGrid = styled(FormGrid)`
  min-height: 200px;
`;

const attendingClinicianLabel = (
  <TranslatedText
    stringId="general.attendingClinician.label"
    fallback="Attending :clinician"
    replacements={{
      clinician: (
        <TranslatedText
          stringId="general.localisedField.clinician.label.short"
          fallback="Clinician"
          casing="lower"
          data-test-id='translatedtext-o2ql' />
      ),
    }}
    data-test-id='translatedtext-73df' />
);

const mannerOfDeathVisibilityCriteria = {
  mannerOfDeath: Object.values(MANNER_OF_DEATHS).filter(x => x !== 'Disease'),
};

export const DeathForm = React.memo(
  ({
    onCancel,
    onSubmit,
    patient,
    deathData,
    practitionerSuggester,
    diagnosisSuggester,
    facilitySuggester,
  }) => {
    const { getTranslation } = useTranslation();
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
            then: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="death.causeOfDeath.label"
                  fallback="Cause Of Death"
                  data-test-id='translatedtext-dvpn' />,
              ),
          }),
          causeOfDeathInterval: yup.string().when('isPartialWorkflow', {
            is: undefined,
            then: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="death.timeBetweenOnsetAndDeath.label"
                  fallback="Time between onset and death"
                  data-test-id='translatedtext-uox2' />,
              ),
          }),
          clinicianId: yup
            .string()
            .required()
            .translatedLabel(attendingClinicianLabel),
          lastSurgeryDate: yup
            .date()
            .max(
              yup.ref('timeOfDeath'),
              getTranslation(
                'validation.rule.dateOfSurgeryNotAfterTimeOfDeath',
                "Date of last surgery can't be after time of death",
              ),
            ),
          mannerOfDeathDate: yup
            .date()
            .max(
              yup.ref('timeOfDeath'),
              getTranslation(
                'death.validation.rule.mannerOfDeathDateNotAfterTimeOfDeath',
                "Manner of death date can't be after time of death",
              ),
            ),
          timeOfDeath: yup
            .date()
            .min(
              patient.dateOfBirth,
              getTranslation(
                'death.validation.rule.timeOfDeathNotBeforeDateOfBirth',
                "Time of death can't be before date of birth",
              ),
            )
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="death.validation.timeOfDeath.path"
                fallback="Time of death"
                data-test-id='translatedtext-lg3x' />,
            ),
        })}
        initialValues={{
          outsideHealthFacility: false,
          timeOfDeath: patient?.dateOfDeath || getCurrentDateTimeString(),
          clinicianId: deathData?.clinicianId || currentUser.id,
        }}
        formType={FORM_TYPES.CREATE_FORM}
      >
        <StyledFormGrid columns={1}>
          <Field
            name="timeOfDeath"
            label={<TranslatedText
              stringId="death.timeOfDeath.label"
              fallback="Date/Time"
              data-test-id='translatedtext-6j7j' />}
            component={props => <DateTimeField {...props} InputProps={{}} data-test-id='datetimefield-d2h3' />}
            saveDateAsString
            required
            data-test-id='field-sw93' />
          <Field
            name="clinicianId"
            label={
              <TranslatedText
                stringId="general.attendingClinician.label"
                fallback="Attending :clinician"
                replacements={{
                  clinician: (
                    <TranslatedText
                      stringId="general.localisedField.clinician.label.short"
                      fallback="Clinician"
                      casing="lower"
                      data-test-id='translatedtext-2fou' />
                  ),
                }}
                data-test-id='translatedtext-7raa' />
            }
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
            data-test-id='field-jl2p' />
        </StyledFormGrid>
        <StyledFormGrid columns={2}>
          <FieldWithTooltip
            name="causeOfDeath"
            label={<TranslatedText
              stringId="death.causeOfDeath.label"
              fallback="Cause Of Death"
              data-test-id='translatedtext-j4ki' />}
            component={AutocompleteField}
            suggester={diagnosisSuggester}
            tooltipText={
              <TranslatedText
                stringId="death.causeOfDeath.tooltip"
                fallback="This does not mean the mode of dying (e.g heart failure, respiratory failure). It means the disease, injury or complication that caused the death."
                data-test-id='translatedtext-hk3r' />
            }
            required
          />
          <Field
            name="causeOfDeathInterval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time between onset and death"
                data-test-id='translatedtext-6j16' />
            }
            component={TimeWithUnitField}
            required
            data-test-id='field-vjqm' />
          <Field
            name="antecedentCause1"
            label={
              <TranslatedText
                stringId="death.atecedentCause.label"
                fallback="Due to (or as a consequence of)"
                data-test-id='translatedtext-1ztz' />
            }
            component={AutocompleteField}
            suggester={diagnosisSuggester}
            data-test-id='field-b6es' />
          <Field
            name="antecedentCause1Interval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time between onset and death"
                data-test-id='translatedtext-e6w8' />
            }
            component={TimeWithUnitField}
            data-test-id='field-kcra' />
          <Field
            name="antecedentCause2"
            label={
              <TranslatedText
                stringId="death.atecedentCause.label"
                fallback="Due to (or as a consequence of)"
                data-test-id='translatedtext-qud3' />
            }
            component={AutocompleteField}
            suggester={diagnosisSuggester}
            data-test-id='field-aiqe' />
          <Field
            name="antecedentCause2Interval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time between onset and death"
                data-test-id='translatedtext-i7zm' />
            }
            component={TimeWithUnitField}
            data-test-id='field-cdpc' />
          <Field
            name="antecedentCause3"
            label={
              <TranslatedText
                stringId="death.atecedentCause.label"
                fallback="Due to (or as a consequence of)"
                data-test-id='translatedtext-h3oz' />
            }
            component={AutocompleteField}
            suggester={diagnosisSuggester}
            data-test-id='field-e3t7' />
          <Field
            name="antecedentCause3Interval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time between onset and death"
                data-test-id='translatedtext-9jh6' />
            }
            component={TimeWithUnitField}
            data-test-id='field-f45y' />
          <FormSeparatorLine />
          <Field
            name="otherContributingConditions"
            component={ArrayField}
            renderField={(index, DeleteButton) => (
              <>
                <Field
                  name={`otherContributingConditions[${index}].cause`}
                  label={
                    <TranslatedText
                      stringId="death.otherContributionCondition.label"
                      fallback="Other contributing condition"
                      data-test-id='translatedtext-ghdp' />
                  }
                  component={AutocompleteField}
                  suggester={diagnosisSuggester}
                  data-test-id='field-396z' />
                <MuiBox display="flex" alignItems="center">
                  <Field
                    name={`otherContributingConditions[${index}].interval`}
                    label={
                      <TranslatedText
                        stringId="death.timeBetweenOnsetAndDeath.label"
                        fallback="Time between onset and death"
                        data-test-id='translatedtext-9jbv' />
                    }
                    component={TimeWithUnitField}
                    data-test-id='field-xmo1' />
                  {index > 0 && DeleteButton}
                </MuiBox>
              </>
            )}
            data-test-id='field-ee5p' />
          <FormSeparatorLine />
          <Field
            name="facilityId"
            label={<TranslatedText
              stringId="general.facility.label"
              fallback="Facility"
              data-test-id='translatedtext-ao9r' />}
            component={AutocompleteField}
            suggester={facilitySuggester}
            data-test-id='field-y0yj' />
          <Field
            name="outsideHealthFacility"
            label={
              <TranslatedText
                stringId="death.outsideHealthFacility.label"
                fallback="Died outside health facility"
                data-test-id='translatedtext-mqjc' />
            }
            component={CheckField}
            style={{ gridColumn: '1/-1', marginBottom: '10px', marginTop: '5px' }}
            data-test-id='field-c0f4' />
        </StyledFormGrid>
        <StyledFormGrid columns={1}>
          <Field
            name="surgeryInLast4Weeks"
            label={
              <TranslatedText
                stringId="death.surgeryInLast4Weeks.label"
                fallback="Was surgery performed in the last 4 weeks?"
                data-test-id='translatedtext-4710' />
            }
            component={RadioField}
            options={BINARY_UNKNOWN_OPTIONS}
            data-test-id='field-md9g' />
          <Field
            name="lastSurgeryDate"
            label={
              <TranslatedText
                stringId="death.lastSurgeryDate.label"
                fallback="What was the date of surgery"
                data-test-id='translatedtext-szmg' />
            }
            component={DateField}
            saveDateAsString
            visibilityCriteria={{ surgeryInLast4Weeks: 'yes' }}
            data-test-id='field-ck2w' />
          <Field
            name="lastSurgeryReason"
            label={
              <TranslatedText
                stringId="death.lastSurgeryReason.label"
                fallback="What was the reason for the surgery"
                data-test-id='translatedtext-ce9c' />
            }
            component={AutocompleteField}
            suggester={diagnosisSuggester}
            visibilityCriteria={{ surgeryInLast4Weeks: 'yes' }}
            data-test-id='field-9hmy' />
        </StyledFormGrid>
        {canBePregnant ? (
          <StyledFormGrid columns={1}>
            <Field
              name="pregnant"
              label={
                <TranslatedText
                  stringId="death.pregnant.label"
                  fallback="Was the woman pregnant?"
                  data-test-id='translatedtext-g8m1' />
              }
              component={RadioField}
              options={BINARY_UNKNOWN_OPTIONS}
              data-test-id='field-ayi0' />
            <Field
              name="pregnancyContribute"
              label={
                <TranslatedText
                  stringId="death.pregnancyContribute.label"
                  fallback="Did the pregnancy contribute to the death?"
                  data-test-id='translatedtext-y65h' />
              }
              component={RadioField}
              options={BINARY_UNKNOWN_OPTIONS}
              visibilityCriteria={{ pregnant: 'yes' }}
              data-test-id='field-d2kt' />
          </StyledFormGrid>
        ) : null}
        <StyledFormGrid columns={1}>
          <Field
            name="mannerOfDeath"
            label={
              <TranslatedText
                stringId="death.mannerOfDeath.label"
                fallback="What was the manner of death?"
                data-test-id='translatedtext-m7xa' />
            }
            component={TranslatedSelectField}
            enumValues={MANNER_OF_DEATHS}
            required
            data-test-id='field-wtyn' />
          <Field
            name="mannerOfDeathDate"
            label={
              <TranslatedText
                stringId="death.mannerOfDeathDate.label"
                fallback="What date did this external cause occur?"
                data-test-id='translatedtext-fa0u' />
            }
            component={DateField}
            saveDateAsString
            visibilityCriteria={mannerOfDeathVisibilityCriteria}
            data-test-id='field-hyfc' />
          <Field
            name="mannerOfDeathLocation"
            label={
              <TranslatedText
                stringId="death.mannerOfDeathLocation.label"
                fallback="Where did this external cause occur?"
                data-test-id='translatedtext-9wcx' />
            }
            component={TranslatedSelectField}
            enumValues={PLACE_OF_DEATHS}
            visibilityCriteria={mannerOfDeathVisibilityCriteria}
            data-test-id='field-ngdu' />
          <Field
            name="mannerOfDeathOther"
            label={<TranslatedText
              stringId="general.other.label"
              fallback="Other"
              data-test-id='translatedtext-cf5s' />}
            component={TextField}
            visibilityCriteria={{ mannerOfDeathLocation: 'Other' }}
            data-test-id='field-r2ol' />
        </StyledFormGrid>
        {isInfant ? (
          <StyledFormGrid columns={1}>
            <Field
              name="fetalOrInfant"
              label={
                <TranslatedText
                  stringId="death.fetalOrInfant.label"
                  fallback="Was the death fetal or infant?"
                  data-test-id='translatedtext-r9cq' />
              }
              component={RadioField}
              options={BINARY_OPTIONS}
              data-test-id='field-b0l4' />
            <Field
              name="stillborn"
              label={
                <TranslatedText
                  stringId="death.stillborn.label"
                  fallback="Was it a stillbirth?"
                  data-test-id='translatedtext-3e97' />
              }
              component={RadioField}
              options={BINARY_UNKNOWN_OPTIONS}
              data-test-id='field-bxxe' />
            <Field
              name="birthWeight"
              label={
                <TranslatedText
                  stringId="death.birthWeight.label"
                  fallback="Birth Weight (grams):"
                  data-test-id='translatedtext-n5v1' />
              }
              component={NumberField}
              data-test-id='field-1asm' />
            <Field
              name="numberOfCompletedPregnancyWeeks"
              label={
                <TranslatedText
                  stringId="death.numberOfCompletedPregnancyWeeks.label"
                  fallback="Number of completed weeks of pregnancy:"
                  data-test-id='translatedtext-nlyg' />
              }
              component={NumberField}
              data-test-id='field-zikl' />
            <Field
              name="ageOfMother"
              label={<TranslatedText
                stringId="death.ageOfMother.label"
                fallback="Age of mother"
                data-test-id='translatedtext-0o6i' />}
              component={NumberField}
              data-test-id='field-fyif' />
            <Field
              name="motherExistingCondition"
              label={
                <TranslatedText
                  stringId="death.motherExistingCondition.label"
                  fallback="Any condition in mother affecting the fetus or newborn?"
                  data-test-id='translatedtext-wg6y' />
              }
              component={AutocompleteField}
              suggester={diagnosisSuggester}
              data-test-id='field-us2c' />
            <Field
              name="deathWithin24HoursOfBirth"
              label={
                <TranslatedText
                  stringId="death.deathWithin24HoursOfBirth.label"
                  fallback="Was the death within 24 hours of birth?"
                  data-test-id='translatedtext-uvef' />
              }
              component={RadioField}
              options={BINARY_OPTIONS}
              data-test-id='field-l9fv' />
            <Field
              name="numberOfHoursSurvivedSinceBirth"
              label={
                <TranslatedText
                  stringId="death.numberOfHoursSurvived.label"
                  fallback="If yes, number of hours survived"
                  data-test-id='translatedtext-8dk9' />
              }
              component={NumberField}
              data-test-id='field-1zw6' />
          </StyledFormGrid>
        ) : null}
      </PaginatedForm>
    );
  },
);
