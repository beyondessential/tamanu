import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import MuiBox from '@material-ui/core/Box';
import {
  MANNER_OF_DEATHS,
  PLACE_OF_DEATHS,
  FORM_TYPES,
  PREGNANCY_MOMENTS,
} from '@tamanu/constants';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import {
  ArrayField,
  AutocompleteField,
  CheckField,
  DateField,
  DateTimeField,
  Field,
  FieldWithTooltip,
  FormSeparatorLine,
  NumberField,
  PaginatedForm,
  RadioField,
  TimeWithUnitField,
} from '../components';
import { TextField, TranslatedSelectField, FormGrid, useDateTime } from '@tamanu/ui-components';
import { useAuth } from '../contexts/Auth';
import { DeathFormScreen } from './DeathFormScreen';
import { SummaryScreenThree, SummaryScreenTwo } from './DeathFormSummaryScreens';
import { BINARY_OPTIONS, BINARY_UNKNOWN_OPTIONS } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';

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

const Subheading = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 21px;
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

const mannerOfDeathVisibilityCriteria = {
  mannerOfDeath: Object.values(MANNER_OF_DEATHS).filter(x => x !== 'Disease'),
};

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
        component={props => <DateTimeField {...props} data-testid="datetimefield-8fsq" />}
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
    const { getCurrentDateTime } = useDateTime();
    const [currentTOD, setCurrentTOD] = useState(
      patient?.dateOfDeath || getCurrentDateTime(),
    );
    const { getTranslation } = useTranslation();
    const { currentUser } = useAuth();
    const showPregnantQuestions = canBePregnant(currentTOD, patient);
    const showInfantQuestions = isInfant(currentTOD, patient);
    const handleSubmit = data => {
      onSubmit({
        ...data,
        fetalOrInfant: showInfantQuestions ? 'yes' : 'no',
      });
    };

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
          timeOfDeath: patient?.dateOfDeath || getCurrentDateTime(),
          clinicianId: deathData?.clinicianId || currentUser.id,
        }}
        formType={FORM_TYPES.CREATE_FORM}
        data-testid="paginatedform-9jrc"
      >
        {!deathData ? <PartialWorkflowPage practitionerSuggester={practitionerSuggester} /> : null}
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
        <StyledFormGrid columns={1} data-testid="styledformgrid-e4ss">
          <Field
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
          />
          <Field
            name="mannerOfDeathDate"
            label={
              <TranslatedText
                stringId="death.mannerOfDeathDate.label"
                fallback="Date of external cause"
                data-testid="translatedtext-d3kf"
              />
            }
            component={DateField}
            visibilityCriteria={mannerOfDeathVisibilityCriteria}
            data-testid="field-ezni"
          />
          <Field
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
          />
          <Field
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
          />
          <Field
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
          />
        </StyledFormGrid>
        {showPregnantQuestions ? (
          <StyledFormGrid columns={1} data-testid="styledformgrid-gkfk">
            <Field
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
            />
            <Field
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
            />
            <Field
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
            />
          </StyledFormGrid>
        ) : null}
        {showInfantQuestions ? (
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
        ) : null}
      </PaginatedForm>
    );
  },
);
