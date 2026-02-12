import React from 'react';
import styled from 'styled-components';
import { differenceInYears, parseISO } from 'date-fns';
import {
  BINARY_OPTIONS,
  BINARY_UNKNOWN_OPTIONS,
  REFERENCE_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
} from '@tamanu/constants';
import {
  DateField,
  Field,
  FormSeparatorLine,
  HierarchyFields,
  NumberField,
  RadioField,
} from '../components';
import { TextField, SelectField, FormGrid } from '@tamanu/ui-components';
import { TranslatedText } from '../components/Translation/TranslatedText';

const StyledFormGrid = styled(FormGrid)`
  min-height: 200px;
  padding-left: 10px;
`;

const Subheading = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 21px;
`;

const FSM_MARITAL_STATUS_OPTIONS = [
  { value: 'Married', label: 'Married' },
  { value: 'Not married', label: 'Not married' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Divorced', label: 'Divorced' },
];

const DEATH_LOCATION_HIERARCHY_FIELDS = [
  {
    name: 'fsmStateOfDeathId',
    referenceType: REFERENCE_TYPES.DIVISION,
    label: (
      <TranslatedText
        stringId="death.fsm.stateOfDeath.label"
        fallback="Place of death - State"
        data-testid="translatedtext-fsm-state-death"
      />
    ),
  },
  {
    name: 'fsmAtollOfDeathId',
    referenceType: REFERENCE_TYPES.SUBDIVISION,
    label: (
      <TranslatedText
        stringId="death.fsm.atollOfDeath.label"
        fallback="Place of death - atoll or island group"
        data-testid="translatedtext-fsm-atoll-death"
      />
    ),
  },
  {
    name: 'fsmVillageOfDeathId',
    referenceType: REFERENCE_TYPES.VILLAGE,
    label: (
      <TranslatedText
        stringId="death.fsm.villageOfDeath.label"
        fallback="Place of death - Village or municipality"
        data-testid="translatedtext-fsm-village-death"
      />
    ),
  },
];

const isChildBearingAge = (timeOfDeath, patient) => {
  if (!timeOfDeath || !patient?.dateOfBirth || patient?.sex !== 'female') return false;
  const age = differenceInYears(parseISO(timeOfDeath), parseISO(patient.dateOfBirth));
  return age >= 15 && age <= 44;
};

export const FSMSpecificQuestions = () => {
  return (
    <StyledFormGrid columns={2} data-testid="styledformgrid-fsm-page-two">
      <HierarchyFields
        relationType={REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY}
        leafNodeType={REFERENCE_TYPES.VILLAGE}
        fields={DEATH_LOCATION_HIERARCHY_FIELDS}
        data-testid="hierarchyfields-fsm-death-location"
      />
      <Field
        name="fsmMaritalStatus"
        label={
          <TranslatedText
            stringId="death.fsm.maritalStatus.label"
            fallback="Marital status"
            data-testid="translatedtext-fsm-marital-status"
          />
        }
        component={SelectField}
        options={FSM_MARITAL_STATUS_OPTIONS}
        data-testid="field-fsm-marital-status"
      />
      <Field
        name="fsmSurvivingSpouse"
        label={
          <TranslatedText
            stringId="death.fsm.survivingSpouse.label"
            fallback="Surviving spouse - maiden name"
            data-testid="translatedtext-fsm-surviving-spouse"
          />
        }
        component={TextField}
        data-testid="field-fsm-surviving-spouse"
      />
      <Field
        name="fsmUsualOccupation"
        label={
          <TranslatedText
            stringId="death.fsm.usualOccupation.label"
            fallback="Usual occupation"
            data-testid="translatedtext-fsm-usual-occupation"
          />
        }
        component={TextField}
        data-testid="field-fsm-usual-occupation"
      />
      <Field
        name="fsmKindOfBusiness"
        label={
          <TranslatedText
            stringId="death.fsm.kindOfBusiness.label"
            fallback="Type of business/industry"
            data-testid="translatedtext-fsm-kind-of-business"
          />
        }
        component={TextField}
        data-testid="field-fsm-kind-of-business"
      />
      <FormSeparatorLine data-testid="formseparatorline-fsm-2" />
      <Field
        name="fsmInformantName"
        label={
          <TranslatedText
            stringId="death.fsm.informantName.label"
            fallback="Informant name (the person providing the information in this Certificate, if applicable)"
            data-testid="translatedtext-fsm-informant-name"
          />
        }
        component={TextField}
        style={{ gridColumn: '1/-1' }}
        data-testid="field-fsm-informant-name"
      />
      <Field
        name="fsmInformantAddress"
        label={
          <TranslatedText
            stringId="death.fsm.informantAddress.label"
            fallback="Informant address"
            data-testid="translatedtext-fsm-informant-address"
          />
        }
        component={TextField}
        style={{ gridColumn: '1/-1' }}
        data-testid="field-fsm-informant-address"
      />
      <Field
        name="fsmInformantRelationship"
        label={
          <TranslatedText
            stringId="death.fsm.informantRelationship.label"
            fallback="Informant relationship (to deceased)"
            data-testid="translatedtext-fsm-informant-relationship"
          />
        }
        component={TextField}
        data-testid="field-fsm-informant-relationship"
      />
      <Field
        name="fsmDateInfoGiven"
        label={
          <TranslatedText
            stringId="death.fsm.dateInfoGiven.label"
            fallback="Date on which information was provided"
            data-testid="translatedtext-fsm-date-info-given"
          />
        }
        component={DateField}
        format="MM/dd/yyyy"
        saveDateAsString
        data-testid="field-fsm-date-info-given"
      />
      <FormSeparatorLine data-testid="formseparatorline-fsm-3" />
      <Field
        name="fsmCertifiedByPhysician"
        label={
          <TranslatedText
            stringId="death.fsm.certifiedByPhysician.label"
            fallback="Certified by (name of physician):"
            data-testid="translatedtext-fsm-certified-by"
          />
        }
        component={TextField}
        data-testid="field-fsm-certified-by"
      />
      <Field
        name="fsmReviewedByPhysician"
        label={
          <TranslatedText
            stringId="death.fsm.reviewedByPhysician.label"
            fallback="Report reviewed by (name of physician):"
            data-testid="translatedtext-fsm-reviewed-by"
          />
        }
        component={TextField}
        data-testid="field-fsm-reviewed-by"
      />
    </StyledFormGrid>
  );
};

export const InfantPage = () => {
  return (
    <StyledFormGrid columns={1} data-testid="styledformgrid-7x1s">
      <Subheading>
        <TranslatedText
          stringId="death.fetalOrInfantDeathDetails.label"
          fallback="Details on fetal or infant death"
          data-testid="translatedtext-fetal-infant-death-details"
        />
      </Subheading>
      <Field
        name="multiplePregnancy"
        label={
          <TranslatedText
            stringId="death.multiplePregnancy.label"
            fallback="Multiple pregnancy"
            data-testid="translatedtext-9c6g"
          />
        }
        component={RadioField}
        options={BINARY_UNKNOWN_OPTIONS}
        data-testid="field-y4u7"
      />
      <Field
        name="stillborn"
        label={
          <TranslatedText
            stringId="death.stillborn.label"
            fallback="Stillbirth"
            data-testid="translatedtext-ki92"
          />
        }
        component={RadioField}
        options={BINARY_UNKNOWN_OPTIONS}
        data-testid="field-yol7"
      />
      <Field
        name="deathWithin24HoursOfBirth"
        label={
          <TranslatedText
            stringId="death.deathWithin24HoursOfBirth.label"
            fallback="Was the death within 24 hours of birth?"
            data-testid="translatedtext-s42j"
          />
        }
        component={RadioField}
        options={BINARY_OPTIONS}
        data-testid="field-z06p"
      />
      <Field
        name="numberOfHoursSurvivedSinceBirth"
        label={
          <TranslatedText
            stringId="death.numberOfHoursSurvived.label"
            fallback="Number of hours survived"
            data-testid="translatedtext-ubzt"
          />
        }
        component={NumberField}
        min={0}
        visibilityCriteria={{ deathWithin24HoursOfBirth: 'yes' }}
        data-testid="field-fhz5"
      />
      <Field
        name="birthWeight"
        label={
          <TranslatedText
            stringId="death.birthWeight.label"
            fallback="Birth weight (grams):"
            data-testid="translatedtext-mkew"
          />
        }
        component={NumberField}
        min={0}
        data-testid="field-k1l7"
      />
      <Field
        name="numberOfCompletedPregnancyWeeks"
        label={
          <TranslatedText
            stringId="death.numberOfCompletedPregnancyWeeks.label"
            fallback="Number of completed weeks of pregnancy"
            data-testid="translatedtext-au8c"
          />
        }
        component={NumberField}
        min={0}
        data-testid="field-urj7"
      />
      <Field
        name="ageOfMother"
        label={
          <TranslatedText
            stringId="death.ageOfMother.label"
            fallback="Age of mother"
            data-testid="translatedtext-6fp9"
          />
        }
        component={NumberField}
        min={0}
        data-testid="field-k593"
      />
      <Field
        name="motherConditionDescription"
        label={
          <TranslatedText
            stringId="death.motherConditionDescription.label"
            fallback="If the death was perinatal, state conditions of mother that affected the fetus/newborn"
            data-testid="translatedtext-2c2y"
          />
        }
        component={TextField}
        data-testid="field-p0rp"
      />
    </StyledFormGrid>
  );
};

export const FSMPregnancyPage = ({ patient, currentTOD }) => {
  const showChildBearingFields = isChildBearingAge(currentTOD, patient);

  if (!showChildBearingFields) return null;

  return (
    <StyledFormGrid columns={2} data-testid="styledformgrid-fsm-pregnancy">
      <Field
        name="fsmPregnantNow"
        label={
          <TranslatedText
            stringId="death.fsm.pregnantNow.label"
            fallback="Was the patient pregnant at the time of death?"
            data-testid="translatedtext-fsm-pregnant-now"
          />
        }
        component={RadioField}
        options={BINARY_OPTIONS}
        style={{ gridColumn: '1/-1' }}
        data-testid="field-fsm-pregnant-now"
      />
      <Field
        name="fsmNumberOfWeeks"
        label={
          <TranslatedText
            stringId="death.fsm.numberOfWeeks.label"
            fallback="Number of weeks of pregnancy"
            data-testid="translatedtext-fsm-number-of-weeks"
          />
        }
        component={NumberField}
        min={0}
        visibilityCriteria={{ fsmPregnantNow: 'yes' }}
        data-testid="field-fsm-number-of-weeks"
      />
      <Field
        name="fsmDeathWithin42Days"
        label={
          <TranslatedText
            stringId="death.fsm.deathWithin42Days.label"
            fallback="Had the patient delivered a baby or undergone an abortion in the 42 days before their death?"
            data-testid="translatedtext-fsm-death-within-42-days"
          />
        }
        component={RadioField}
        options={BINARY_OPTIONS}
        style={{ gridColumn: '1/-1' }}
        visibilityCriteria={{ fsmPregnantNow: 'no' }}
        data-testid="field-fsm-death-within-42-days"
      />
      <Field
        name="fsmDateOfDeliveryAbortion"
        label={
          <TranslatedText
            stringId="death.fsm.dateOfDeliveryAbortion.label"
            fallback="Date of that delivery/abortion?"
            data-testid="translatedtext-fsm-date-delivery-abortion"
          />
        }
        component={DateField}
        saveDateAsString
        visibilityCriteria={{ fsmDeathWithin42Days: 'yes' }}
        data-testid="field-fsm-date-delivery-abortion"
      />
    </StyledFormGrid>
  );
};

export const FSMInjuryPage = () => {
  return (
    <StyledFormGrid columns={2} data-testid="styledformgrid-fsm-injury">
      <Field
        name="fsmDateOfInjury"
        label={
          <TranslatedText
            stringId="death.fsm.dateOfInjury.label"
            fallback="Date of external cause"
            data-testid="translatedtext-fsm-date-of-injury"
          />
        }
        component={DateField}
        saveDateAsString
        data-testid="field-fsm-date-of-injury"
      />
      <Field
        name="fsmInjuryAtWork"
        label={
          <TranslatedText
            stringId="death.fsm.injuryAtWork.label"
            fallback="Did the injury occur at work?"
            data-testid="translatedtext-fsm-injury-at-work"
          />
        }
        component={RadioField}
        options={BINARY_OPTIONS}
        data-testid="field-fsm-injury-at-work"
      />
    </StyledFormGrid>
  );
};
