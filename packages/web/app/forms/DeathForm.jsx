import Box from '@mui/material/Box';
import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { BINARY_UNKNOWN_OPTIONS, FORM_TYPES, FSM_FIELDS, SEX_VALUES } from '@tamanu/constants';
import { FormGrid, TranslatedText, useDateTime } from '@tamanu/ui-components';
import {
  ArrayField,
  AutocompleteField,
  CheckField,
  DateField,
  DateTimeField,
  Field,
  FieldWithTooltip,
  FormSeparatorLine,
  PaginatedForm,
  RadioField,
  TimeWithUnitField,
  useSettings,
  useTranslation,
} from '../components';
import { useAuth } from '../contexts/Auth';
import {
  FSMMannerOfDeathPage,
  FSMPregnancyPage,
  FSMSpecificQuestions,
  getFSMMannerOfDeathPageFields,
  getFSMPregnancyPageFields,
  getInfantPageFields,
  getMannerOfDeathPageFields,
  getPregnancyPageFields,
  InfantPage,
  MannerOfDeathPage,
  PregnancyPage,
} from './DeathFormOptionalPages';
import { DeathFormScreen } from './DeathFormScreen';
import { SummaryScreenThree, SummaryScreenTwo } from './DeathFormSummaryScreens';

const PrefixWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Prefix = styled.span`
  position: absolute;
  left: -20px;
  top: 32px;
  font-weight: 500;
`;

const AutocompleteFieldWithPrefix = ({ prefix, ...props }) => (
  <PrefixWrapper>
    <Prefix>{prefix}</Prefix>
    <AutocompleteField {...props} style={{ width: '100%' }} />
  </PrefixWrapper>
);

const StyledCheckField = styled(CheckField)`
  .MuiFormControlLabel-label {
    font-size: 14px;
  }
`;

const StyledFormGrid = styled(FormGrid)`
  min-height: 200px;
  padding-left: 10px;
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

// These fields are both on page 1 and page 2. This allows
// partial workflow and is intended by design.
const PrimaryFields = ({ practitionerSuggester }) => {
  return (
    <>
      <Field
        name="timeOfDeath"
        label={
          <TranslatedText stringId="death.timeOfDeath.label" fallback="Date & time of death" />
        }
        component={props => <DateTimeField {...props} data-testid="datetimefield-8fsq" />}
        required
        data-testid="field-o3sc"
      />
      <Field
        name="clinicianId"
        label={attendingClinicianLabel}
        component={AutocompleteField}
        suggester={practitionerSuggester}
        required
        data-testid="field-j9h1"
      />
    </>
  );
};

const TwoThirdsFormGrid = styled(StyledFormGrid)`
  > * {
    grid-column: span 2;
  }
`;

const SurgeryFormGrid = styled(StyledFormGrid)`
  > * {
    grid-column: span 3;
  }
`;

const PartialWorkflowPage = ({ practitionerSuggester }) => {
  return (
    <TwoThirdsFormGrid columns={3} data-testid="styledformgrid-o83r">
      <PrimaryFields practitionerSuggester={practitionerSuggester} />
    </TwoThirdsFormGrid>
  );
};

const canBePregnant = (timeOfDeath, patient) => {
  const canConceive = patient.sex === SEX_VALUES.FEMALE || patient.sex === SEX_VALUES.OTHER;
  return (
    canConceive && differenceInYears(parseISO(timeOfDeath), parseISO(patient.dateOfBirth)) >= 12
  );
};

const isInfant = (timeOfDeath, patient) => {
  return differenceInMonths(parseISO(timeOfDeath), parseISO(patient.dateOfBirth)) <= 12;
};

const canBePregnantFSM = (timeOfDeath, patient) => {
  if (!timeOfDeath || !patient?.dateOfBirth) return false;
  if (patient?.sex !== SEX_VALUES.FEMALE && patient?.sex !== SEX_VALUES.OTHER) return false;
  const age = differenceInYears(parseISO(timeOfDeath), parseISO(patient.dateOfBirth));
  return age >= 15 && age <= 44;
};

// Nest the FSM fields in the extraData object (we avoid using formik's nested objects
// to be able to use the visibility criteria functionality across the optional pages)
const transformData = (data, showInfantQuestions) => {
  const mainData = {};
  const extraData = {};

  Object.entries(data).forEach(([key, value]) => {
    if (FSM_FIELDS.includes(key)) {
      extraData[key] = value;
    } else {
      mainData[key] = value;
    }
  });

  return {
    ...mainData,
    extraData,
    fetalOrInfant: showInfantQuestions ? 'yes' : 'no',
  };
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
    const { getCurrentDateTime } = useDateTime();
    const [currentTOD, setCurrentTOD] = useState(patient?.dateOfDeath || getCurrentDateTime());
    const { getTranslation } = useTranslation();
    const { currentUser } = useAuth();
    const { getSetting } = useSettings();
    const showInfantQuestions = isInfant(currentTOD, patient);
    const handleSubmit = data => {
      onSubmit(transformData(data, showInfantQuestions));
    };
    const isFSMStyleEnabled = getSetting('fsmCrvsCertificates.enableFSMStyle');
    const showPregnantFSMQuestions = isFSMStyleEnabled && canBePregnantFSM(currentTOD, patient);
    const showPregnantQuestions = !isFSMStyleEnabled && canBePregnant(currentTOD, patient);

    // Needed to use the visibility criteria functionality across the optional pages
    const fsmMannerOfDeathPageFields = useMemo(() => getFSMMannerOfDeathPageFields(), []);
    const mannerOfDeathPageFields = useMemo(() => getMannerOfDeathPageFields(), []);
    const infantPageFields = useMemo(() => getInfantPageFields(), []);
    const pregnancyPageFields = useMemo(() => getPregnancyPageFields(), []);
    const fsmPregnancyPageFields = useMemo(() => getFSMPregnancyPageFields(), []);

    return (
      <PaginatedForm
        onSubmit={handleSubmit}
        onCancel={onCancel}
        FormScreen={DeathFormScreen}
        SummaryScreen={deathData ? SummaryScreenTwo : SummaryScreenThree}
        setParentState={setCurrentTOD}
        validationSchema={yup.object().shape({
          causeOfDeath: yup.string().when('isPartialWorkflow', {
            is: undefined,
            then: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText stringId="death.causeOfDeath.label" fallback="Cause of death" />,
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
                  fallback="Time interval from onset to death"
                />,
              ),
          }),
          mannerOfDeath: yup.string().when('isPartialWorkflow', {
            is: undefined,
            then: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="death.mannerOfDeath.label"
                  fallback="What was the manner of death?"
                />,
              ),
          }),
          clinicianId: yup.string().required().translatedLabel(attendingClinicianLabel),
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
                "Date & time of death can't be before date of birth",
              ),
            )
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="death.validation.timeOfDeath.path"
                fallback="Date & time of death"
              />,
            ),
        })}
        initialValues={{
          outsideHealthFacility: false,
          timeOfDeath: patient?.dateOfDeath || getCurrentDateTime(),
          clinicianId: deathData?.clinicianId || currentUser.id,
        }}
        formType={FORM_TYPES.CREATE_FORM}
        data-testid="paginatedform-9jrc"
      >
        {!deathData ? <PartialWorkflowPage practitionerSuggester={practitionerSuggester} /> : null}
        {isFSMStyleEnabled ? <FSMSpecificQuestions /> : null}
        <StyledFormGrid columns={2} data-testid="styledformgrid-5gyh">
          <FieldWithTooltip
            name="causeOfDeath"
            label={<TranslatedText stringId="death.causeOfDeath.label" fallback="Cause of death" />}
            component={AutocompleteFieldWithPrefix}
            prefix="a."
            suggester={diagnosisSuggester}
            $tooltipText={
              <TranslatedText
                stringId="death.causeOfDeath.tooltip"
                fallback="This does not mean the mode of dying (e.g heart failure, respiratory failure). It means the disease, injury or complication that caused the death."
              />
            }
            required
            data-testid="fieldwithtooltip-gyk3"
          />
          <Field
            name="causeOfDeathInterval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time interval from onset to death"
              />
            }
            component={TimeWithUnitField}
            required
            data-testid="field-vmbd"
          />
          <Field
            name="antecedentCause1"
            label={
              <TranslatedText
                stringId="death.atecedentCause.label"
                fallback="Due to (or as a consequence of)"
              />
            }
            component={AutocompleteFieldWithPrefix}
            prefix="b."
            suggester={diagnosisSuggester}
            data-testid="field-jbod"
          />
          <Field
            name="antecedentCause1Interval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time interval from onset to death"
              />
            }
            component={TimeWithUnitField}
            data-testid="field-hoj6"
          />
          <Field
            name="antecedentCause2"
            label={
              <TranslatedText
                stringId="death.atecedentCause.label"
                fallback="Due to (or as a consequence of)"
              />
            }
            component={AutocompleteFieldWithPrefix}
            prefix="c."
            suggester={diagnosisSuggester}
            data-testid="field-ypmx"
          />
          <Field
            name="antecedentCause2Interval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time interval from onset to death"
              />
            }
            component={TimeWithUnitField}
            data-testid="field-xc0c"
          />
          <Field
            name="antecedentCause3"
            label={
              <TranslatedText
                stringId="death.atecedentCause.label"
                fallback="Due to (or as a consequence of)"
              />
            }
            component={AutocompleteFieldWithPrefix}
            prefix="d."
            suggester={diagnosisSuggester}
            data-testid="field-g6oi"
          />
          <Field
            name="antecedentCause3Interval"
            label={
              <TranslatedText
                stringId="death.timeBetweenOnsetAndDeath.label"
                fallback="Time interval from onset to death"
              />
            }
            component={TimeWithUnitField}
            data-testid="field-lmus"
          />
          <FormSeparatorLine data-testid="formseparatorline-5nba" />
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
                      fallback="Other significant contributing condition"
                    />
                  }
                  component={AutocompleteField}
                  suggester={diagnosisSuggester}
                  data-testid="field-xblv"
                />
                <Box display="flex" alignItems="center" data-testid="muibox-ar5o">
                  <Field
                    name={`otherContributingConditions[${index}].interval`}
                    label={
                      <TranslatedText
                        stringId="death.timeBetweenOnsetAndDeath.label"
                        fallback="Time interval from onset to death"
                      />
                    }
                    component={TimeWithUnitField}
                    data-testid="field-l9px"
                  />
                  {index > 0 && DeleteButton}
                </Box>
              </>
            )}
            data-testid="field-psio"
          />
          <FormSeparatorLine data-testid="formseparatorline-ejds" />
          <PrimaryFields practitionerSuggester={practitionerSuggester} />
          <Field
            name="facilityId"
            label={<TranslatedText stringId="general.facility.label" fallback="Facility" />}
            component={AutocompleteField}
            suggester={facilitySuggester}
            data-testid="field-8lsl"
          />
          <Field
            name="outsideHealthFacility"
            label={
              <TranslatedText
                stringId="death.outsideHealthFacility.label"
                fallback="Died outside health facility"
              />
            }
            component={StyledCheckField}
            style={{ gridColumn: '1/-1', marginBottom: '10px', marginTop: '5px' }}
            data-testid="field-oj7z"
          />
        </StyledFormGrid>
        <SurgeryFormGrid columns={4} data-testid="styledformgrid-pd77">
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
            data-testid="field-ywwk"
          />
          <Field
            name="lastSurgeryDate"
            label={
              <TranslatedText stringId="death.lastSurgeryDate.label" fallback="Date of surgery" />
            }
            component={DateField}
            style={{ gridColumn: 'span 2' }}
            visibilityCriteria={{ surgeryInLast4Weeks: 'yes' }}
            data-testid="field-lnqy"
          />
          <Field
            name="lastSurgeryReason"
            label={
              <TranslatedText
                stringId="death.lastSurgeryReason.label"
                fallback="Please specify the reason for surgery (disease or condition)"
              />
            }
            component={AutocompleteField}
            suggester={diagnosisSuggester}
            visibilityCriteria={{ surgeryInLast4Weeks: 'yes' }}
            data-testid="field-qrk8"
          />
          <Field
            name="autopsyRequested"
            label={
              <TranslatedText
                stringId="death.autopsyRequested.label"
                fallback="Was an autopsy requested?"
              />
            }
            component={RadioField}
            options={BINARY_UNKNOWN_OPTIONS}
            data-testid="field-13rp"
          />
          <Field
            name="autopsyFindingsUsed"
            label={
              <TranslatedText
                stringId="death.autopsyFindingsUsed.label"
                fallback="Were the findings used in the certification?"
              />
            }
            component={RadioField}
            options={BINARY_UNKNOWN_OPTIONS}
            visibilityCriteria={{ autopsyRequested: 'yes' }}
            data-testid="field-333j"
          />
        </SurgeryFormGrid>
        {isFSMStyleEnabled ? (
          <FSMMannerOfDeathPage>{fsmMannerOfDeathPageFields}</FSMMannerOfDeathPage>
        ) : (
          <MannerOfDeathPage>{mannerOfDeathPageFields}</MannerOfDeathPage>
        )}
        {showPregnantFSMQuestions ? (
          <FSMPregnancyPage>{fsmPregnancyPageFields}</FSMPregnancyPage>
        ) : null}
        {showPregnantQuestions ? <PregnancyPage>{pregnancyPageFields}</PregnancyPage> : null}
        {showInfantQuestions ? <InfantPage>{infantPageFields}</InfantPage> : null}
      </PaginatedForm>
    );
  },
);
