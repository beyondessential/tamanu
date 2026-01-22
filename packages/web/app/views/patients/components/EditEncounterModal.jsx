import React from 'react';
import styled from 'styled-components';

import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  DateField,
  DateTimeField,
  Form,
  FormGrid,
  TextField,
  useApi,
  useSettings,
  useSuggester,
} from '@tamanu/ui-components';
import {
  DynamicSelectField,
  Field,
  FormModal,
  LocalisedField,
  ModalFormActionRow,
  RadioField,
  SuggesterSelectField,
} from '../../../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useEncounter } from '../../../contexts/Encounter';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { isEmergencyPatient } from '../../../utils/isEmergencyPatient';

const StyledFormGrid = styled(FormGrid)`
  margin-bottom: 20px;
`;

const HospitalAdmissionFields = () => {
  const referralSourceSuggester = useSuggester('referralSource');

  return (
    <>
      <Field
        name="startDate"
        component={DateTimeField}
        label={
          <TranslatedText
            stringId="encounter.admissionDateTime.label"
            fallback="Admission date & time"
          />
        }
        required
        data-testid="field-admission-time"
      />
      <Field
        name="estimatedEndDate"
        component={DateField}
        saveDateAsString
        label={
          <TranslatedText
            stringId="patient.encounter.movePatient.estimatedDischargeDate.label"
            fallback="Estimated discharge date"
          />
        }
        data-testid="field-discharge-date"
      />
      <LocalisedField
        name="patientBillingTypeId"
        label={
          <TranslatedText
            stringId="general.localisedField.patientBillingTypeId.label"
            fallback="Patient type"
            data-testid="translatedtext-67v8"
          />
        }
        endpoint="patientBillingType"
        component={SuggesterSelectField}
        data-testid="localisedfield-amji"
      />
      <Field
        name="referralSourceId"
        component={DynamicSelectField}
        suggester={referralSourceSuggester}
        label={
          <TranslatedText stringId="encounter.referralSource.label" fallback="Referral source" />
        }
        data-testid="field-referral-source"
      />
      <div style={{ gridColumn: '1 / -1' }}>
        <LocalisedField
          name="dietIds"
          component={SuggesterSelectField}
          endpoint="diet"
          isMulti
          label={<TranslatedText stringId="encounter.diet.label" fallback="Diet" />}
          data-testid="field-diet"
        />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <LocalisedField
          name="reasonForEncounter"
          component={TextField}
          label={
            <TranslatedText
              stringId="encounter.reasonForEncounter.label"
              fallback="Reason for encounter"
            />
          }
          data-testid="field-reasonForEncounter"
        />
      </div>
    </>
  );
};

const PatientTypeField = styled(LocalisedField)`
  grid-column-start: 1;
`;

const ClinicFields = () => {
  const referralSourceSuggester = useSuggester('referralSource');

  return (
    <>
      <Field
        name="startDate"
        component={DateTimeField}
        label={
          <TranslatedText
            stringId="encounter.checkInDateTime.label"
            fallback="Check-in date & time"
          />
        }
        required
        data-testid="field-check-in-time"
      />
      <PatientTypeField
        name="patientBillingTypeId"
        label={
          <TranslatedText
            stringId="general.localisedField.patientBillingTypeId.label"
            fallback="Patient type"
            data-testid="translatedtext-67v8"
          />
        }
        endpoint="patientBillingType"
        component={SuggesterSelectField}
        data-testid="localisedfield-amji"
      />
      <Field
        name="referralSourceId"
        component={DynamicSelectField}
        suggester={referralSourceSuggester}
        label={
          <TranslatedText stringId="encounter.referralSource.label" fallback="Referral source" />
        }
        data-testid="field-referral-source"
      />
      <div style={{ gridColumn: '1 / -1' }}>
        <LocalisedField
          name="reasonForEncounter"
          component={TextField}
          label={
            <TranslatedText
              stringId="encounter.reasonForEncounter.label"
              fallback="Reason for encounter"
            />
          }
          data-testid="field-reason-for-encounter"
        />
      </div>
    </>
  );
};

const TriageFields = () => {
  const { getSetting } = useSettings();
  const triageCategories = getSetting('triageCategories');
  const triageReasonSuggester = useSuggester('triageReason');
  const secondaryTriageReasonSuggester = useSuggester('triageReason');

  return (
    <>
      <Field
        name="arrivalTime"
        component={DateTimeField}
        label={
          <TranslatedText stringId="triage.arrivalDateTime.label" fallback="Arrival date & time" />
        }
        data-testid="field-admission-time"
      />
      <Field
        name="startDate"
        component={DateTimeField}
        label={
          <TranslatedText stringId="triage.triageDateTime.label" fallback="Triage date & time" />
        }
        required
        data-testid="field-admission-time"
      />
      <LocalisedField
        name="arrivalModeId"
        label={
          <TranslatedText
            stringId="general.localisedField.arrivalModeId.label"
            fallback="Arrival mode"
            data-testid="translatedtext-7qdb"
          />
        }
        component={SuggesterSelectField}
        endpoint="arrivalMode"
        data-testid="localisedfield-hjex"
      />
      <Field
        name="score"
        label={
          <TranslatedText
            stringId="triage.triageScore.label"
            fallback="Triage score"
            data-testid="translatedtext-0xff"
          />
        }
        component={RadioField}
        fullWidth
        options={triageCategories?.map(x => ({ value: x.level.toString(), ...x })) || []}
        style={{ gridColumn: '1/-1' }}
        data-testid="field-4vw2"
      />
      <div style={{ gridColumn: '1 / -1' }}>
        <Field
          name="chiefComplaintId"
          label={
            <TranslatedText
              stringId="triage.chiefComplaint.label"
              fallback="Chief complaint"
              data-testid="translatedtext-tdrb"
            />
          }
          component={DynamicSelectField}
          suggester={triageReasonSuggester}
          required
          data-testid="field-a7cu"
        />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field
          name="secondaryComplaintId"
          label={
            <TranslatedText
              stringId="triage.secondaryComplaint.label"
              fallback="Secondary complaint"
              data-testid="translatedtext-1xyf"
            />
          }
          component={DynamicSelectField}
          suggester={secondaryTriageReasonSuggester}
          data-testid="field-1ktz"
        />
      </div>
    </>
  );
};

const FormFields = ({ encounterType }) => {
  switch (encounterType) {
    case ENCOUNTER_TYPES.ADMISSION:
      return <HospitalAdmissionFields />;
    case ENCOUNTER_TYPES.CLINIC:
      return <ClinicFields />;
    case ENCOUNTER_TYPES.TRIAGE:
    case ENCOUNTER_TYPES.EMERGENCY:
    case ENCOUNTER_TYPES.OBSERVATION:
      return <TriageFields />;
    default:
      return 'No edit template for this encounter type found';
  }
};

const getFormInitialValues = ({ encounter, triage = {} }) => {
  const {
    diets,
    referralSourceId,
    patientBillingTypeId,
    reasonForEncounter,
    startDate,
    estimatedEndDate,
  } = encounter;

  const { chiefComplaintId, secondaryComplaintId, arrivalTime, arrivalModeId, score } = triage;

  const baseInitialValues = { startDate };
  switch (encounter.encounterType) {
    case ENCOUNTER_TYPES.ADMISSION:
      return {
        ...baseInitialValues,
        dietIds: JSON.stringify(diets?.map(diet => diet.id)),
        referralSourceId,
        patientBillingTypeId,
        reasonForEncounter,
        estimatedEndDate,
      };
    case ENCOUNTER_TYPES.CLINIC:
      return {
        ...baseInitialValues,
        referralSourceId,
        patientBillingTypeId,
        reasonForEncounter,
      };
    case ENCOUNTER_TYPES.TRIAGE:
    case ENCOUNTER_TYPES.EMERGENCY:
    case ENCOUNTER_TYPES.OBSERVATION:
      return {
        ...baseInitialValues,
        chiefComplaintId,
        secondaryComplaintId,
        arrivalTime,
        arrivalModeId,
        score,
      };
    default:
      return {};
  }
};

export const EditEncounterModal = React.memo(({ open, onClose, encounter }) => {
  const api = useApi();
  const { writeAndViewEncounter } = useEncounter();

  const triage = encounter.triages?.[0];

  const onSubmitTriageForm = async ({
    startDate,
    arrivalTime,
    arrivalModeId,
    score,
    chiefComplaintId,
    secondaryComplaintId,
  }) => {
    await api.put(`triage/${triage.id}`, {
      submittedTime: getCurrentDateTimeString(),
      encounterId: encounter.id,
      arrivalTime,
      triageTime: startDate,
      arrivalModeId,
      score,
      chiefComplaintId,
      secondaryComplaintId,
    });
    await writeAndViewEncounter(encounter.id, { startDate, skipSystemNotes: true });

  };

  const onSubmitEncounterForm = async ({
    startDate,
    referralSourceId,
    patientBillingTypeId,
    dietIds,
    reasonForEncounter,
    estimatedEndDate,
  }) => {
    await writeAndViewEncounter(encounter.id, {
      startDate,
      referralSourceId,
      patientBillingTypeId,
      dietIds,
      reasonForEncounter,
      estimatedEndDate,
    });
  };

  return (
    <FormModal
      title="Edit encounter details"
      open={open}
      onClose={onClose}
      data-testid="formmodal-httn"
      width="md"
    >
      <Form
        initialValues={getFormInitialValues({ encounter, triage })}
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={isEmergencyPatient(encounter.encounterType) ? onSubmitTriageForm : onSubmitEncounterForm}
        render={({ submitForm }) => (
          <>
            <StyledFormGrid>
              <FormFields encounterType={encounter.encounterType} />
            </StyledFormGrid>
            <ModalFormActionRow
              onConfirm={submitForm}
              confirmText={
                <TranslatedText
                  stringId="general.action.saveChanges"
                  fallback="Save changes"
                  data-testid="translatedtext-lvb6"
                />
              }
              onCancel={onClose}
              data-testid="modalformactionrow-35ou"
            />
          </>
        )}
        data-testid="form-0lgu"
      />
    </FormModal>
  );
});
