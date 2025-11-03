import React from 'react';
import styled from 'styled-components';

import { FORM_TYPES } from '@tamanu/constants/forms';
import {
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

const StyledFormGrid = styled(FormGrid)`
  margin-bottom: 20px;
  position: relative;
`;

const InfoPopupLabel = React.memo(() => (
  <span>
    <span>
      <TranslatedText
        stringId="patient.modal.triage.triageScore.label"
        fallback="Triage score"
        data-testid="translatedtext-0xff"
      />
    </span>
  </span>
));

const HospitalAdmissionFields = () => {
  const referralSourceSuggester = useSuggester('referralSource');

  return (
    <>
      <Field
        name="startDate"
        component={DateTimeField}
        label={
          <TranslatedText
            stringId="patient.encounter.movePatient.admissionTime.label"
            fallback="Admission date & time"
          />
        }
        required
        data-testid="field-admission-time"
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
          <TranslatedText
            stringId="patient.encounter.movePatient.referralSource.label"
            fallback="Referral source"
          />
        }
        data-testid="field-referral-source"
      />
      <div style={{ gridColumn: '1 / -1' }}>
        <LocalisedField
          name="dietIds"
          component={SuggesterSelectField}
          endpoint="diet"
          isMulti
          label={
            <TranslatedText stringId="patient.encounter.movePatient.diet.label" fallback="Diet" />
          }
          data-testid="field-diet"
        />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <LocalisedField
          name="reasonForEncounter"
          component={TextField}
          label={
            <TranslatedText
              stringId="patient.encounter.movePatient.reasonForEncounter.label"
              fallback="Reason for encounter"
            />
          }
          data-testid="field-diet"
        />
      </div>
    </>
  );
};

const ClinicFields = () => {
  const referralSourceSuggester = useSuggester('referralSource');

  return (
    <>
      <Field
        name="startDate"
        component={DateTimeField}
        label={
          <TranslatedText
            stringId="patient.encounter.movePatient.checkInDate.label"
            fallback="Check-in date & time"
          />
        }
        required
        data-testid="field-admission-time"
      />
      {/* TODO: should be an empty field space here */}
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
          <TranslatedText
            stringId="patient.encounter.movePatient.referralSource.label"
            fallback="Referral source"
          />
        }
        data-testid="field-referral-source"
      />
      <div style={{ gridColumn: '1 / -1' }}>
        <LocalisedField
          name="reasonForEncounter"
          component={TextField}
          label={
            <TranslatedText
              stringId="patient.encounter.movePatient.reasonForEncounter.label"
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
          <TranslatedText
            stringId="patient.encounter.movePatient.arrivalTime.label"
            fallback="Arrival date & time"
          />
        }
        data-testid="field-admission-time"
      />
      <Field
        name="startDate"
        component={DateTimeField}
        label={
          <TranslatedText
            stringId="patient.encounter.movePatient.triageTime.label"
            fallback="Triage date & time"
          />
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
        label={<InfoPopupLabel data-testid="infopopuplabel-5isv" />}
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
              stringId="patient.modal.triage.chiefComplaint.label"
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
              stringId="patient.modal.triage.secondaryComplaint.label"
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

const getFormFields = encounterType => {
  switch (encounterType) {
    case ENCOUNTER_TYPES.ADMISSION:
      return <HospitalAdmissionFields />;
    case ENCOUNTER_TYPES.CLINIC:
      return <ClinicFields />;
    case ENCOUNTER_TYPES.TRIAGE:
      return <TriageFields />;
    default:
      return 'No form fields found';
  }
};

export const EditEncounterModal = React.memo(({ open, onClose, encounter }) => {
  const api = useApi();

  const { writeAndViewEncounter } = useEncounter();

  // TODO: figure out how to handle multiple triages
  const triage = encounter.triages?.[0];

  const onSubmit = async values => {
    const {
      startDate,
      arrivalTime,
      arrivalModeId,
      score,
      chiefComplaintId,
      secondaryComplaintId,
      referralSourceId,
      patientBillingTypeId,
      dietIds,
      reasonForEncounter,
    } = values;

    if (encounter.encounterType === ENCOUNTER_TYPES.TRIAGE) {
      await api.put(`triage/${triage.id}`, {
        encounterId: encounter.id,
        arrivalTime,
        triageTime: startDate,
        arrivalModeId,
        score,
        chiefComplaintId,
        secondaryComplaintId,
      });
    }

    await writeAndViewEncounter(encounter.id, {
      startDate,
      referralSourceId,
      patientBillingTypeId,
      dietIds,
      reasonForEncounter,
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
        initialValues={{
          startDate: encounter.startDate,
          referralSourceId: encounter.referralSourceId,
          patientBillingTypeId: encounter.patientBillingTypeId,
          dietIds: JSON.stringify(encounter.diets.map(diet => diet.id)),
          reasonForEncounter: encounter.reasonForEncounter,
          ...(triage && {
            chiefComplaintId: triage.chiefComplaintId,
            secondaryComplaintId: triage.secondaryComplaintId,
            arrivalTime: triage.arrivalTime,
            arrivalModeId: triage.arrivalModeId,
            score: triage.score,
          }),
        }}
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={onSubmit}
        render={({ submitForm }) => (
          <>
            <StyledFormGrid columns={2}>{getFormFields(encounter.encounterType)}</StyledFormGrid>
            <ModalFormActionRow
              onConfirm={submitForm}
              confirmText={'TEST'}
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
