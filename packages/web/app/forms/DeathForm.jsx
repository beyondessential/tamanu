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
        />
      ),
    }}
  />
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
                <TranslatedText stringId="death.causeOfDeath.label" fallback="Cause Of Death" />,
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
                />,
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
              />,
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
            label={<TranslatedText stringId="death.timeOfDeath.label" fallback="Date/Time" />}
            component={props => <DateTimeField {...props} InputProps={{}} />}
            saveDateAsString
            required
          />
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
                    />
                  ),
                }}
              />
            }
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
        </StyledFormGrid>
        <StyledFormGrid columns={2}>
          <FieldWithTooltip
            name="causeOfDeath"
            label={<TranslatedText stringId="death.causeOfDeath.label" fallback="Cause Of Death" />}
            component={AutocompleteField}
            suggester={diagnosisSuggester}
            tooltipText={
              <TranslatedText
                stringId="death.causeOfDeath.tooltip"
                fallback="This does not mean the mode of dying (e.g heart failure, respiratory failure). It means the disease, injury or complication that caused the death."
              />
            }
            required
          />
          <Field
            name="causeOfDeathInterval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time between onset and death"
              />
            }
            component={TimeWithUnitField}
            required
          />
          <Field
            name="antecedentCause1"
            label={
              <TranslatedText
                stringId="death.atecedentCause.label"
                fallback="Due to (or as a consequence of)"
              />
            }
            component={AutocompleteField}
            suggester={diagnosisSuggester}
          />
          <Field
            name="antecedentCause1Interval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time between onset and death"
              />
            }
            component={TimeWithUnitField}
          />
          <Field
            name="antecedentCause2"
            label={
              <TranslatedText
                stringId="death.atecedentCause.label"
                fallback="Due to (or as a consequence of)"
              />
            }
            component={AutocompleteField}
            suggester={diagnosisSuggester}
          />
          <Field
            name="antecedentCause2Interval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time between onset and death"
              />
            }
            component={TimeWithUnitField}
          />
          <Field
            name="antecedentCause3"
            label={
              <TranslatedText
                stringId="death.atecedentCause.label"
                fallback="Due to (or as a consequence of)"
              />
            }
            component={AutocompleteField}
            suggester={diagnosisSuggester}
          />
          <Field
            name="antecedentCause3Interval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time between onset and death"
              />
            }
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
                  label={
                    <TranslatedText
                      stringId="death.otherContributionCondition.label"
                      fallback="Other contributing condition"
                    />
                  }
                  component={AutocompleteField}
                  suggester={diagnosisSuggester}
                />
                <MuiBox display="flex" alignItems="center">
                  <Field
                    name={`otherContributingConditions[${index}].interval`}
                    label={
                      <TranslatedText
                        stringId="death.timeBetweenOnsetAndDeath.label"
                        fallback="Time between onset and death"
                      />
                    }
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
            label={<TranslatedText stringId="general.facility.label" fallback="Facility" />}
            component={AutocompleteField}
            suggester={facilitySuggester}
          />
          <Field
            name="outsideHealthFacility"
            label={
              <TranslatedText
                stringId="death.outsideHealthFacility.label"
                fallback="Died outside health facility"
              />
            }
            component={CheckField}
            style={{ gridColumn: '1/-1', marginBottom: '10px', marginTop: '5px' }}
          />
        </StyledFormGrid>
        <StyledFormGrid columns={1}>
          <Field
            name="surgeryInLast4Weeks"
            label={
              <TranslatedText
                stringId="death.surgeryInLast4Weeks.label"
                fallback="Was surgery performed in the last 4 weeks?"
              />
            }
            component={RadioField}
            options={BINARY_UNKNOWN_OPTIONS}
          />
          <Field
            name="lastSurgeryDate"
            label={
              <TranslatedText
                stringId="death.lastSurgeryDate.label"
                fallback="What was the date of surgery"
              />
            }
            component={DateField}
            saveDateAsString
            visibilityCriteria={{ surgeryInLast4Weeks: 'yes' }}
          />
          <Field
            name="lastSurgeryReason"
            label={
              <TranslatedText
                stringId="death.lastSurgeryReason.label"
                fallback="What was the reason for the surgery"
              />
            }
            component={AutocompleteField}
            suggester={diagnosisSuggester}
            visibilityCriteria={{ surgeryInLast4Weeks: 'yes' }}
          />
        </StyledFormGrid>
        {canBePregnant ? (
          <StyledFormGrid columns={1}>
            <Field
              name="pregnant"
              label={
                <TranslatedText
                  stringId="death.pregnant.label"
                  fallback="Was the woman pregnant?"
                />
              }
              component={RadioField}
              options={BINARY_UNKNOWN_OPTIONS}
            />
            <Field
              name="pregnancyContribute"
              label={
                <TranslatedText
                  stringId="death.pregnancyContribute.label"
                  fallback="Did the pregnancy contribute to the death?"
                />
              }
              component={RadioField}
              options={BINARY_UNKNOWN_OPTIONS}
              visibilityCriteria={{ pregnant: 'yes' }}
            />
          </StyledFormGrid>
        ) : null}
        <StyledFormGrid columns={1}>
          <Field
            name="mannerOfDeath"
            label={
              <TranslatedText
                stringId="death.mannerOfDeath.label"
                fallback="What was the manner of death?"
              />
            }
            component={TranslatedSelectField}
            enumValues={MANNER_OF_DEATHS}
            required
          />
          <Field
            name="mannerOfDeathDate"
            label={
              <TranslatedText
                stringId="death.mannerOfDeathDate.label"
                fallback="What date did this external cause occur?"
              />
            }
            component={DateField}
            saveDateAsString
            visibilityCriteria={mannerOfDeathVisibilityCriteria}
          />
          <Field
            name="mannerOfDeathLocation"
            label={
              <TranslatedText
                stringId="death.mannerOfDeathLocation.label"
                fallback="Where did this external cause occur?"
              />
            }
            component={TranslatedSelectField}
            enumValues={PLACE_OF_DEATHS}
            visibilityCriteria={mannerOfDeathVisibilityCriteria}
          />
          <Field
            name="mannerOfDeathOther"
            label={<TranslatedText stringId="general.other.label" fallback="Other" />}
            component={TextField}
            visibilityCriteria={{ mannerOfDeathLocation: 'Other' }}
          />
        </StyledFormGrid>
        {isInfant ? (
          <StyledFormGrid columns={1}>
            <Field
              name="fetalOrInfant"
              label={
                <TranslatedText
                  stringId="death.fetalOrInfant.label"
                  fallback="Was the death fetal or infant?"
                />
              }
              component={RadioField}
              options={BINARY_OPTIONS}
            />
            <Field
              name="stillborn"
              label={
                <TranslatedText stringId="death.stillborn.label" fallback="Was it a stillbirth?" />
              }
              component={RadioField}
              options={BINARY_UNKNOWN_OPTIONS}
            />
            <Field
              name="birthWeight"
              label={
                <TranslatedText
                  stringId="death.birthWeight.label"
                  fallback="Birth Weight (grams):"
                />
              }
              component={NumberField}
            />
            <Field
              name="numberOfCompletedPregnancyWeeks"
              label={
                <TranslatedText
                  stringId="death.numberOfCompletedPregnancyWeeks.label"
                  fallback="Number of completed weeks of pregnancy:"
                />
              }
              component={NumberField}
            />
            <Field
              name="ageOfMother"
              label={<TranslatedText stringId="death.ageOfMother.label" fallback="Age of mother" />}
              component={NumberField}
            />
            <Field
              name="motherExistingCondition"
              label={
                <TranslatedText
                  stringId="death.motherExistingCondition.label"
                  fallback="Any condition in mother affecting the fetus or newborn?"
                />
              }
              component={AutocompleteField}
              suggester={diagnosisSuggester}
            />
            <Field
              name="deathWithin24HoursOfBirth"
              label={
                <TranslatedText
                  stringId="death.deathWithin24HoursOfBirth.label"
                  fallback="Was the death within 24 hours of birth?"
                />
              }
              component={RadioField}
              options={BINARY_OPTIONS}
            />
            <Field
              name="numberOfHoursSurvivedSinceBirth"
              label={
                <TranslatedText
                  stringId="death.numberOfHoursSurvived.label"
                  fallback="If yes, number of hours survived"
                />
              }
              component={NumberField}
            />
          </StyledFormGrid>
        ) : null}
      </PaginatedForm>
    );
  },
);
