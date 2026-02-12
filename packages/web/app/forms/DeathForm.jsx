import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import MuiBox from '@material-ui/core/Box';
import { FORM_TYPES, BINARY_UNKNOWN_OPTIONS } from '@tamanu/constants';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
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
} from '../components';
import { FormGrid } from '@tamanu/ui-components';
import { useAuth } from '../contexts/Auth';
import { DeathFormScreen } from './DeathFormScreen';
import { SummaryScreenThree, SummaryScreenTwo } from './DeathFormSummaryScreens';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import {
  FSMSpecificQuestions,
  InfantPage,
  MannerOfDeathPage,
  PregnancyPage,
} from './DeathFormOptionalPages';
import { useSettings } from '../contexts/Settings';

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
          data-testid="translatedtext-8vf4"
        />
      ),
    }}
    data-testid="translatedtext-7vdz"
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
          <TranslatedText
            stringId="death.timeOfDeath.label"
            fallback="Date & time of death"
            data-testid="translatedtext-x1yy"
          />
        }
        component={props => (
          <DateTimeField {...props} data-testid="datetimefield-8fsq" />
        )}
        saveDateAsString
        required
        data-testid="field-o3sc"
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
                  data-testid="translatedtext-2e0w"
                />
              ),
            }}
            data-testid="translatedtext-w8w6"
          />
        }
        component={AutocompleteField}
        suggester={practitionerSuggester}
        required
        data-testid="field-j9h1"
      />
    </>
  );
};

const PartialWorkflowPage = ({ practitionerSuggester }) => {
  return (
    <StyledFormGrid columns={1} data-testid="styledformgrid-o83r">
      <PrimaryFields practitionerSuggester={practitionerSuggester} />
    </StyledFormGrid>
  );
};

const canBePregnant = (timeOfDeath, patient) => {
  const isFemale = patient.sex === 'female';
  return isFemale && differenceInYears(parseISO(timeOfDeath), parseISO(patient.dateOfBirth)) >= 12;
};

const isInfant = (timeOfDeath, patient) => {
  return differenceInMonths(parseISO(timeOfDeath), parseISO(patient.dateOfBirth)) <= 12;
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
    const [currentTOD, setCurrentTOD] = useState(patient?.dateOfDeath || getCurrentDateTimeString());
    const { getTranslation } = useTranslation();
    const { currentUser } = useAuth();
    const { getSetting } = useSettings();
    const showPregnantQuestions = canBePregnant(currentTOD, patient);
    const showInfantQuestions = isInfant(currentTOD, patient);
    const handleSubmit = (data) => {
      onSubmit({
        ...data,
        fetalOrInfant: showInfantQuestions ? 'yes' : 'no',
      });
    };
    const isFSMStyleEnabled = getSetting('fsmCrvsCertificates.enableFSMStyle');

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
                <TranslatedText
                  stringId="death.causeOfDeath.label"
                  fallback="Cause of death"
                  data-testid="translatedtext-jg7t"
                />,
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
                  data-testid="translatedtext-ss0n"
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
                "Date & time of death can't be before date of birth",
              ),
            )
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="death.validation.timeOfDeath.path"
                fallback="Date & time of death"
                data-testid="translatedtext-ubdv"
              />,
            ),
        })}
        initialValues={{
          outsideHealthFacility: false,
          timeOfDeath: patient?.dateOfDeath || getCurrentDateTimeString(),
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
            label={
              <TranslatedText
                stringId="death.causeOfDeath.label"
                fallback="Cause of death"
                data-testid="translatedtext-x2zt"
              />
            }
            component={AutocompleteFieldWithPrefix}
            prefix="a."
            suggester={diagnosisSuggester}
            $tooltipText={
              <TranslatedText
                stringId="death.causeOfDeath.tooltip"
                fallback="This does not mean the mode of dying (e.g heart failure, respiratory failure). It means the disease, injury or complication that caused the death."
                data-testid="translatedtext-tync"
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
                data-testid="translatedtext-k2wn"
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
                data-testid="translatedtext-0bm8"
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
                data-testid="translatedtext-crsz"
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
                data-testid="translatedtext-y3mg"
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
                data-testid="translatedtext-ypeg"
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
                data-testid="translatedtext-ufzf"
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
                data-testid="translatedtext-23g8"
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
                      data-testid="translatedtext-pjt7"
                    />
                  }
                  component={AutocompleteField}
                  suggester={diagnosisSuggester}
                  data-testid="field-xblv"
                />
                <MuiBox display="flex" alignItems="center" data-testid="muibox-ar5o">
                  <Field
                    name={`otherContributingConditions[${index}].interval`}
                    label={
                      <TranslatedText
                        stringId="death.timeBetweenOnsetAndDeath.label"
                        fallback="Time interval from onset to death"
                        data-testid="translatedtext-kw9v"
                      />
                    }
                    component={TimeWithUnitField}
                    data-testid="field-l9px"
                  />
                  {index > 0 && DeleteButton}
                </MuiBox>
              </>
            )}
            data-testid="field-psio"
          />
          <FormSeparatorLine data-testid="formseparatorline-ejds" />
          <PrimaryFields practitionerSuggester={practitionerSuggester} />
          <Field
            name="facilityId"
            label={
              <TranslatedText
                stringId="general.facility.label"
                fallback="Facility"
                data-testid="translatedtext-wiq7"
              />
            }
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
                data-testid="translatedtext-cfqq"
              />
            }
            component={StyledCheckField}
            style={{ gridColumn: '1/-1', marginBottom: '10px', marginTop: '5px' }}
            data-testid="field-oj7z"
          />
        </StyledFormGrid>
        <StyledFormGrid columns={1} data-testid="styledformgrid-pd77">
          <Field
            name="surgeryInLast4Weeks"
            label={
              <TranslatedText
                stringId="death.surgeryInLast4Weeks.label"
                fallback="Was surgery performed in the last 4 weeks?"
                data-testid="translatedtext-mkip"
              />
            }
            component={RadioField}
            options={BINARY_UNKNOWN_OPTIONS}
            data-testid="field-ywwk"
          />
          <Field
            name="lastSurgeryDate"
            label={
              <TranslatedText
                stringId="death.lastSurgeryDate.label"
                fallback="Date of surgery"
                data-testid="translatedtext-ud0r"
              />
            }
            component={DateField}
            saveDateAsString
            visibilityCriteria={{ surgeryInLast4Weeks: 'yes' }}
            data-testid="field-lnqy"
          />
          <Field
            name="lastSurgeryReason"
            label={
              <TranslatedText
                stringId="death.lastSurgeryReason.label"
                fallback="Please specify the reason for surgery (disease or condition)"
                data-testid="translatedtext-g0fx"
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
                data-testid="translatedtext-l4gw"
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
                data-testid="translatedtext-2u2y"
              />
            }
            component={RadioField}
            options={BINARY_UNKNOWN_OPTIONS}
            visibilityCriteria={{ autopsyRequested: 'yes' }}
            data-testid="field-333j"
          />
        </StyledFormGrid>
        <MannerOfDeathPage />
        {showPregnantQuestions ? <PregnancyPage /> : null}
        {showInfantQuestions ? <InfantPage /> : null}
      </PaginatedForm>
    );
  },
);
