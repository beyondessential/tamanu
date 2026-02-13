import React from 'react';
import styled from 'styled-components';
import {
  BINARY_OPTIONS,
  BINARY_UNKNOWN_OPTIONS,
  REFERENCE_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
  PREGNANCY_MOMENTS,
  MANNER_OF_DEATHS,
  PLACE_OF_DEATHS,
} from '@tamanu/constants';
import {
  DateField,
  Field,
  FormSeparatorLine,
  HierarchyFields,
  NumberField,
  RadioField,
} from '../components';
import { TextField, SelectField, FormGrid, TranslatedSelectField } from '@tamanu/ui-components';
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

const mannerOfDeathVisibilityCriteria = {
  mannerOfDeath: Object.values(MANNER_OF_DEATHS).filter(x => x !== 'Disease'),
};

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

export const FSMSpecificQuestions = () => {
  return (
    <StyledFormGrid columns={2} data-testid="styledformgrid-fsm-page-two">
      <HierarchyFields
        relationType={REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY}
        leafNodeType={REFERENCE_TYPES.VILLAGE}
        fields={DEATH_LOCATION_HIERARCHY_FIELDS}
        removeContainer
        data-testid="hierarchyfields-fsm-death-location"
      />
      <Field
        name="fsmSocialSecurityNumber"
        label={
          <TranslatedText
            stringId="death.fsm.socialSecurityNumber.label"
            fallback="Social security no."
            data-testid="translatedtext-fsm-social-security-number"
          />
        }
        component={TextField}
        data-testid="field-fsm-social-security-number"
      />
      <FormSeparatorLine data-testid="formseparatorline-fsm-1" />
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

export const getMannerOfDeathPageFields = () => [
  <Field
    key="mannerOfDeath"
    name="mannerOfDeath"
    label={
      <TranslatedText
        stringId="death.mannerOfDeath.label"
        fallback="What was the manner of death?"
        data-testid="translatedtext-wvl5"
      />
    }
    component={TranslatedSelectField}
    enumValues={MANNER_OF_DEATHS}
    required
    data-testid="field-ylgd"
  />,
  <Field
    key="mannerOfDeathDate"
    name="mannerOfDeathDate"
    label={
      <TranslatedText
        stringId="death.mannerOfDeathDate.label"
        fallback="Date of external cause"
        data-testid="translatedtext-d3kf"
      />
    }
    component={DateField}
    saveDateAsString
    visibilityCriteria={mannerOfDeathVisibilityCriteria}
    data-testid="field-ezni"
  />,
  <Field
    key="mannerOfDeathDescription"
    name="mannerOfDeathDescription"
    label={
      <TranslatedText
        stringId="death.mannerOfDeathDescription.label"
        fallback="Describe how the external cause occurred. Specify poisoning agent if applicable"
        data-testid="translatedtext-4s7r"
      />
    }
    component={TextField}
    visibilityCriteria={mannerOfDeathVisibilityCriteria}
    data-testid="field-c5l7"
  />,
  <Field
    key="mannerOfDeathLocation"
    name="mannerOfDeathLocation"
    label={
      <TranslatedText
        stringId="death.mannerOfDeathLocation.label"
        fallback="Place of occurrence of the external cause"
        data-testid="translatedtext-d15s"
      />
    }
    component={TranslatedSelectField}
    enumValues={PLACE_OF_DEATHS}
    visibilityCriteria={mannerOfDeathVisibilityCriteria}
    data-testid="field-r81o"
  />,
  <Field
    key="mannerOfDeathOther"
    name="mannerOfDeathOther"
    label={
      <TranslatedText
        stringId="general.other.label"
        fallback="Please specify"
        data-testid="translatedtext-4gij"
      />
    }
    component={TextField}
    visibilityCriteria={{ mannerOfDeathLocation: 'Other' }}
    data-testid="field-u4jw"
  />,
];

export const MannerOfDeathPage = ({ children }) => (
  <StyledFormGrid columns={1} data-testid="styledformgrid-e4ss">
    {children}
  </StyledFormGrid>
);

export const getInfantPageFields = () => [
  <Field
    key="multiplePregnancy"
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
  />,
  <Field
    key="stillborn"
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
  />,
  <Field
    key="deathWithin24HoursOfBirth"
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
  />,
  <Field
    key="numberOfHoursSurvivedSinceBirth"
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
  />,
  <Field
    key="birthWeight"
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
  />,
  <Field
    key="numberOfCompletedPregnancyWeeks"
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
  />,
  <Field
    key="ageOfMother"
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
  />,
  <Field
    key="motherConditionDescription"
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
  />,
];

export const InfantPage = ({ children }) => (
  <StyledFormGrid columns={1} data-testid="styledformgrid-7x1s">
    <Subheading>
      <TranslatedText
        stringId="death.fetalOrInfantDeathDetails.label"
        fallback="Details on fetal or infant death"
        data-testid="translatedtext-fetal-infant-death-details"
      />
    </Subheading>
    {children}
  </StyledFormGrid>
);

export const getPregnancyPageFields = () => [
  <Field
    key="pregnant"
    name="pregnant"
    label={
      <TranslatedText
        stringId="death.pregnant.label"
        fallback="Was the woman pregnant or recently pregnant?"
        data-testid="translatedtext-vvm2"
      />
    }
    component={RadioField}
    options={BINARY_UNKNOWN_OPTIONS}
    data-testid="field-swkw"
  />,
  <Field
    key="pregnancyMoment"
    name="pregnancyMoment"
    label={
      <TranslatedText
        stringId="death.pregnancyMoment.label"
        fallback="When was the woman pregnant?"
        data-testid="translatedtext-o06d"
      />
    }
    component={TranslatedSelectField}
    enumValues={PREGNANCY_MOMENTS}
    visibilityCriteria={{ pregnant: 'yes' }}
    data-testid="field-9j31"
  />,
  <Field
    key="pregnancyContribute"
    name="pregnancyContribute"
    label={
      <TranslatedText
        stringId="death.pregnancyContribute.label"
        fallback="Did the pregnancy contribute to the death?"
        data-testid="translatedtext-1mbh"
      />
    }
    component={RadioField}
    options={BINARY_UNKNOWN_OPTIONS}
    visibilityCriteria={{ pregnant: 'yes' }}
    data-testid="field-bt6f"
  />,
];

export const PregnancyPage = ({ children }) => (
  <StyledFormGrid columns={1} data-testid="styledformgrid-gkfk">
    {children}
  </StyledFormGrid>
);

export const getFSMMannerOfDeathPageFields = () => [
  <Field
    key="mannerOfDeath"
    name="mannerOfDeath"
    label={
      <TranslatedText
        stringId="death.mannerOfDeath.label"
        fallback="What was the manner of death?"
        data-testid="translatedtext-ix0p"
      />
    }
    component={TranslatedSelectField}
    enumValues={MANNER_OF_DEATHS}
    required
    data-testid="field-fsm-manner-of-death"
  />,
  <Field
    key="mannerOfDeathDate"
    name="mannerOfDeathDate"
    label={
      <TranslatedText
        stringId="death.mannerOfDeathDate.label"
        fallback="Date of external cause"
        data-testid="translatedtext-hntf"
      />
    }
    component={DateField}
    saveDateAsString
    visibilityCriteria={mannerOfDeathVisibilityCriteria}
    data-testid="field-fsm-date-of-external-cause"
  />,
  <Field
    key="fsmInjuryAtWork"
    name="fsmInjuryAtWork"
    label={
      <TranslatedText
        stringId="death.fsm.injuryAtWork.label"
        fallback="Did the injury occur at work?"
        data-testid="translatedtext-fsm-injury-at-work"
      />
    }
    component={RadioField}
    options={BINARY_UNKNOWN_OPTIONS}
    style={{ gridColumn: '1/-1' }}
    visibilityCriteria={mannerOfDeathVisibilityCriteria}
    data-testid="field-fsm-injury-at-work"
  />,
  <Field
    key="mannerOfDeathLocation"
    name="mannerOfDeathLocation"
    label={
      <TranslatedText
        stringId="death.fsm.placeOfInjury.label"
        fallback="Place of injury"
        data-testid="translatedtext-fsm-place-of-injury"
      />
    }
    component={TranslatedSelectField}
    enumValues={PLACE_OF_DEATHS}
    visibilityCriteria={mannerOfDeathVisibilityCriteria}
    data-testid="field-fsm-place-of-injury"
  />,
  <Field
    key="mannerOfDeathOther"
    name="mannerOfDeathOther"
    label={
      <TranslatedText
        stringId="death.fsm.location.label"
        fallback="Location (Village, Hamlet, etc.)"
        data-testid="translatedtext-fsm-location"
      />
    }
    component={TextField}
    visibilityCriteria={mannerOfDeathVisibilityCriteria}
    data-testid="field-fsm-location"
  />,
];

export const FSMMannerOfDeathPage = ({ children }) => (
  <StyledFormGrid columns={2} data-testid="styledformgrid-fsm-manner-of-death">
    {children}
  </StyledFormGrid>
);

export const getFSMPregnancyPageFields = () => [
  <Field
    key="fsmPregnantNow"
    name="fsmPregnantNow"
    label={
      <TranslatedText
        stringId="death.fsm.pregnantNow.label"
        fallback="Was the patient pregnant at the time of death?"
        data-testid="translatedtext-fsm-pregnant-now"
      />
    }
    component={RadioField}
    options={BINARY_UNKNOWN_OPTIONS}
    data-testid="field-fsm-pregnant-now"
  />,
  <Field
    key="fsmNumberOfWeeks"
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
  />,
  <Field
    key="pregnancyContribute"
    name="pregnancyContribute"
    label={
      <TranslatedText
        stringId="death.pregnancyContribute.label"
        fallback="Did the pregnancy contribute to the death?"
        data-testid="translatedtext-1mbh"
      />
    }
    component={RadioField}
    options={BINARY_UNKNOWN_OPTIONS}
    visibilityCriteria={{ fsmPregnantNow: 'yes' }}
    data-testid="field-f1kx"
  />,
  <Field
    key="fsmDeathWithin42Days"
    name="fsmDeathWithin42Days"
    label={
      <TranslatedText
        stringId="death.fsm.deathWithin42Days.label"
        fallback="Had the patient delivered a baby or undergone an abortion in the 42 days before their death?"
        data-testid="translatedtext-fsm-death-within-42-days"
      />
    }
    component={RadioField}
    options={BINARY_UNKNOWN_OPTIONS}
    visibilityCriteria={{ fsmPregnantNow: 'no' }}
    data-testid="field-fsm-death-within-42-days"
  />,
  <Field
    key="fsmDateOfDeliveryAbortion"
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
  />,
];

export const FSMPregnancyPage = ({ children }) => (
  <StyledFormGrid columns={1} data-testid="styledformgrid-fsm-pregnancy">
    {children}
  </StyledFormGrid>
);
