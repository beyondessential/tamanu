/* eslint-disable react-hooks/exhaustive-deps */
import { Box } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { FORM_TYPES, NOTE_TYPES } from '@tamanu/constants';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  FormGrid,
  OuterLabelFieldWrapper,
  TextField,
  TranslatedText,
  useApi,
  useDateTime,
  useSettings,
  useTranslation,
} from '@tamanu/ui-components';
import { trimToDate, trimToTime } from '@tamanu/utils/dateTime';
import { useEncounterMedicationQuery } from '../api/queries/useEncounterMedicationQuery';
import { usePatientOngoingPrescriptionsQuery } from '../api/queries/usePatientOngoingPrescriptionsQuery';
import { EncounterSummaryContent } from '../components/EncounterSummary';
import { LocalisedField, PaginatedForm, useLocalisedSchema } from '../components/Field';
import { MedicationDiscontinueModal } from '../components/Medication/MedicationDiscontinueModal';
import { TableFormFields } from '../components/Table';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { useEncounter } from '../contexts/Encounter';
import { createPrescriptionHash } from '../utils/medications';
import { foreignKey } from '../utils/validation';
import { EncounterOverview } from './DischargeEncounterOverview';
import {
  Divider,
  DischargeFormScreen,
  DischargeSummaryScreen,
  UnsavedChangesScreen,
} from './DischargeFormScreens';
import {
  getMedicationsValidationSchema,
  MEDICATION_COLUMNS,
  orderingPrescriberLabel,
  OrderingPrescriberField,
} from './DischargeMedicationColumns';

const MedicationContainer = styled(Box)`
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
`;

const MedicationHeader = styled(Box)`
  font-size: 14px;
  font-weight: 500;
  color: ${Colors.darkestText};
  padding: 12px 20px;
  line-height: 18px;
`;

const EncounterMedicationHeaderRow = styled(Box)`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
`;

const TableContainer = styled(Box)`
  padding: 20px;
  padding-block-end: 15px;
  font-size: 14px;
  line-height: 1.3;
  .MuiTable-root {
    border: none;
  }

  .MuiTableHead-root {
    background-color: transparent;
  }

  .MuiTableCell-root {
    padding-block: 3px;
    padding-inline: 15px;
    &:first-of-type {
      padding-inline-start: 0;
    }
    &:last-of-type {
      padding-inline-end: 0;
    }
  }

  .MuiTableCell-head {
    color: ${p => p.theme.palette.text.secondary};
    font: inherit;
    font-weight: 500;
    text-align: start;
  }

  .MuiTableBody-root .MuiTableCell-body {
    border: none;
    /* Rows have no divider of their own, so the space above does the separating. */
    padding-block-start: 10px;
    &:not(:has(:nth-child(1))) {
      padding-block: 15px 0;
    }
  }

  /* Cells are vertically centred, so a validation message left in flow would move the whole row.
   * It sits out of flow instead, in room the row reserves beneath every cell. */
  .MuiTableBody-root .MuiFormHelperText-root {
    position: absolute;
    inset-block-start: 100%;
  }

  .MuiTableBody-root .MuiTableRow-root:has(.MuiFormHelperText-root) .MuiTableCell-body {
    padding-block-end: 24px;
  }
`;

const dischargingClinicianLabel = (
  <TranslatedText
    stringId="general.dischargingClinician.label"
    fallback="Discharging :clinician"
    replacements={{
      clinician: (
        <TranslatedText
          stringId="general.localisedField.clinician.label"
          fallback="Clinician"
          casing="lower"
        />
      ),
    }}
  />
);

const getDischargeInitialValues = ({
  encounter,
  currentUser,
  dischargeNotes,
  medicationInitialValues,
  getCurrentDateTime,
  storedDateTimeToEpochMilliseconds,
}) => {
  const dischargeDraft = encounter?.dischargeDraft?.discharge;
  const encounterStartMs = storedDateTimeToEpochMilliseconds(encounter.startDate);

  const getInitialEndDate = () => {
    if (!dischargeDraft) {
      if (encounterStartMs != null && encounterStartMs > Date.now()) {
        const primaryNow = getCurrentDateTime();
        const time = trimToTime(primaryNow);
        return time ? `${trimToDate(encounter.startDate)} ${time}` : primaryNow;
      } else {
        return getCurrentDateTime();
      }
    }
    return encounter?.dischargeDraft?.endDate;
  };

  return {
    endDate: getInitialEndDate(),
    discharge: {
      dischargerId: dischargeDraft?.dischargerId || currentUser?.id,
      dispositionId: dischargeDraft?.dispositionId,
      note: dischargeNotes?.map(n => n.content).join('\n\n') || '',
    },
    pharmacyOrder: {
      orderingClinicianId:
        encounter?.dischargeDraft?.pharmacyOrder?.orderingClinicianId || currentUser?.id,
    },
    medications: medicationInitialValues,
    submittedTime: getCurrentDateTime(),
  };
};

/*
Creates an object to add initialValues to Formik that matches
the table-like form fields.
*/
const getMedicationsInitialValues = ({
  encounterMedications,
  ongoingMedications,
  encounter,
  isPharmacyOrderEnabled,
}) => {
  const medicationDraft = encounter?.dischargeDraft?.medications;
  const medicationsInitialValues = {};

  const addMedication = (medication, isSentToPharmacyByDefault) => {
    const key = medication.id;
    medicationsInitialValues[key] = {
      // Left blank rather than zeroed when the prescription has no quantity, so the clinician sees
      // an empty field to fill in rather than a number nobody entered.
      quantity: medicationDraft?.[key]?.quantity ?? medication.quantity ?? null,
      repeats: medicationDraft?.[key]?.repeats ?? medication?.repeats?.toString() ?? '0',
      sendToPharmacy: medicationDraft?.[key]?.sendToPharmacy ?? isSentToPharmacyByDefault,
    };
  };

  // Medications prescribed during the encounter are sent to pharmacy on discharge by default; the
  // patient's other ongoing medications are only sent when the clinician asks for them.
  encounterMedications.forEach(medication => addMedication(medication, isPharmacyOrderEnabled));
  ongoingMedications.forEach(medication => addMedication(medication, false));
  return medicationsInitialValues;
};

/**
 * Medications selected to be sent to pharmacy that have already been sent recently, so the
 * clinician can be asked to confirm them before the order goes out.
 */
const getAlreadyOrderedMedications = ({
  values,
  medications,
  timeoutHours,
  storedDateTimeToEpochMilliseconds,
}) => {
  const cutoffMs = Date.now() - (Number(timeoutHours) || 0) * 60 * 60 * 1000;
  return medications.filter(({ id, lastOrderedAt }) => {
    if (!values.medications?.[id]?.sendToPharmacy || !lastOrderedAt) return false;
    const lastOrderedMs = storedDateTimeToEpochMilliseconds(lastOrderedAt);
    return lastOrderedMs != null && lastOrderedMs > cutoffMs;
  });
};

export const DischargeForm = ({
  dispositionSuggester,
  practitionerSuggester,
  onCancel,
  onSubmit,
  onTitleChange,
}) => {
  const { getTranslation, getEnumTranslation } = useTranslation();
  const { encounter } = useEncounter();
  const { getSetting } = useSettings();
  const { getCurrentDateTime, storedDateTimeToEpochMilliseconds } = useDateTime();
  const queryClient = useQueryClient();
  const { ability, currentUser, facilityId } = useAuth();
  const canUpdateMedication = ability.can('write', 'Medication');
  const canWriteSensitiveMedication = ability.can('write', 'SensitiveMedication');
  const isPharmacyOrderEnabled =
    getSetting('features.pharmacyOrder.enabled') && ability.can('create', 'MedicationRequest');
  const alreadyOrderedConfirmationTimeout = getSetting(
    'features.pharmacyOrder.medicationAlreadyOrderedConfirmationTimeout',
  );
  const requiredInlineMessage = getTranslation('validation.required.inline', '*Required');

  const [dischargeNotes, setDischargeNotes] = useState(null);
  const [showWarningScreen, setShowWarningScreen] = useState(false);
  const [discontinuedMedication, setDiscontinuedMedication] = useState(null);
  const [enableReinitialize, setEnableReinitialize] = useState(true);
  const api = useApi();
  const { getLocalisedSchema } = useLocalisedSchema();
  const dischargeNoteMandatory = getSetting('features.discharge.dischargeNoteMandatory');
  const encounterSummaryEnabled = getSetting('encounterSummary.enabled');
  const canCreateEncounterSummary = ability.can('create', 'EncounterSummary');
  const canWriteEncounterSummary = ability.can('write', 'EncounterSummary');
  const showEncounterSummary =
    encounterSummaryEnabled && canCreateEncounterSummary && canWriteEncounterSummary;
  // Only display diagnoses that don't have a certainty of 'error' or 'disproven'
  const currentDiagnoses = encounter.diagnoses.filter(
    d => !['error', 'disproven'].includes(d.certainty),
  );

  const { data: encounterMedications } = useEncounterMedicationQuery(encounter.id);
  const { data: ongoingPrescriptions } = usePatientOngoingPrescriptionsQuery(
    encounter.patientId,
    facilityId,
  );

  const activeMedications = (encounterMedications?.data || []).filter(
    medication => !medication.discontinued,
  );

  const activeMedicationHashes = new Set(activeMedications.map(createPrescriptionHash));
  const ongoingMedications = (ongoingPrescriptions?.data || [])
    .filter(p => !p.discontinued)
    .filter(p => !activeMedicationHashes.has(createPrescriptionHash(p)));
  const medicationInitialValues = getMedicationsInitialValues({
    encounterMedications: activeMedications,
    ongoingMedications,
    encounter,
    isPharmacyOrderEnabled,
  });

  // Stock is only recorded against a facility's drug list, so the column is dropped entirely where
  // nothing on this discharge has a status to show — matching the dispense medication modal.
  const showStockColumn = [...activeMedications, ...ongoingMedications].some(
    medication => medication.medication?.referenceDrug?.facilities?.[0]?.stockStatus,
  );

  const handleSubmit = useCallback(
    async ({ isDischarged = true, ...data }) => {
      // The server takes the order's facility from the discharging user's token, so only the
      // ordering prescriber travels with the request.
      const submitData = isPharmacyOrderEnabled ? data : { ...data, pharmacyOrder: undefined };
      if (isDischarged) {
        await onSubmit(submitData);
        return;
      }
      await onSubmit({ dischargeDraft: submitData });
    },
    [onSubmit, isPharmacyOrderEnabled],
  );

  useEffect(() => {
    (async () => {
      const { data: notes } = await api.get(`encounter/${encounter.id}/notes`);
      setDischargeNotes(notes.filter(n => n.noteTypeId === NOTE_TYPES.DISCHARGE).reverse()); // reverse order of array to sort by oldest first
    })();
  }, [api, encounter.id]);

  useEffect(() => {
    if (showWarningScreen) {
      onTitleChange(
        <TranslatedText
          stringId="discharge.modal.unsavedChanges.title"
          fallback="Unsaved changes"
        />,
      );
      return;
    }
    onTitleChange(<TranslatedText stringId="discharge.modal.title" fallback="Discharge patient" />);
  }, [showWarningScreen, onTitleChange]);

  useEffect(() => {
    const hasEncounterMeds = Boolean(encounterMedications);
    const hasOngoingMeds = Boolean(ongoingPrescriptions);
    const hasNotes = Boolean(dischargeNotes);
    if (enableReinitialize && hasEncounterMeds && hasOngoingMeds && hasNotes) {
      setEnableReinitialize(false);
    }
  }, [
    Boolean(encounterMedications),
    Boolean(ongoingPrescriptions),
    Boolean(dischargeNotes),
    enableReinitialize,
  ]);

  const handleDiscontinueMedication = medication => {
    setDiscontinuedMedication(medication);
  };

  const medicationColumnOptions = {
    getTranslation,
    getEnumTranslation,
    handleDiscontinueMedication,
    canUpdateMedication,
    canWriteSensitiveMedication,
    isPharmacyOrderEnabled,
    showStockColumn,
  };

  const onDiscontinueMedication = () => {
    queryClient.invalidateQueries(['patient-ongoing-prescriptions', encounter.patientId]);
    queryClient.invalidateQueries(['encounterMedication', encounter.id]);
  };

  return (
    <>
      <PaginatedForm
        onSubmit={handleSubmit}
        onCancel={onCancel}
        initialValues={getDischargeInitialValues({
          encounter,
          currentUser,
          dischargeNotes,
          medicationInitialValues,
          getCurrentDateTime,
          storedDateTimeToEpochMilliseconds,
        })}
        FormScreen={props => (
          <DischargeFormScreen
            {...props}
            currentDiagnoses={currentDiagnoses}
            onSubmit={handleSubmit}
            setShowWarningScreen={setShowWarningScreen}
            data-testid="dischargeformscreen-z2zo"
          />
        )}
        formType={FORM_TYPES.CREATE_FORM}
        SummaryScreen={
          !showWarningScreen
            ? props => (
                <DischargeSummaryScreen
                  {...props}
                  alreadyOrderedConfirmationTimeout={alreadyOrderedConfirmationTimeout}
                  alreadyOrderedMedications={
                    isPharmacyOrderEnabled
                      ? getAlreadyOrderedMedications({
                          values: props.values,
                          medications: [...activeMedications, ...ongoingMedications],
                          timeoutHours: alreadyOrderedConfirmationTimeout,
                          storedDateTimeToEpochMilliseconds,
                        })
                      : []
                  }
                  data-testid="dischargesummaryscreen-p8qk"
                />
              )
            : props => (
                <UnsavedChangesScreen
                  {...props}
                  showWarningScreen={showWarningScreen}
                  onSubmit={handleSubmit}
                  data-testid="unsavedchangesscreen-o64o"
                />
              )
        }
        validationSchema={yup.object().shape({
          endDate: yup
            .date()
            .required()
            .translatedLabel(
              <TranslatedText stringId="discharge.dischargeDate.label" fallback="Discharge date" />,
            ),
          medications: getMedicationsValidationSchema(requiredInlineMessage),
          pharmacyOrder: yup.object().shape({
            orderingClinicianId: yup
              .string()
              .translatedLabel(orderingPrescriberLabel)
              .test('requiredWhenSendingToPharmacy', requiredInlineMessage, function (value) {
                // Only required once something is actually being sent — the field is inactive, and
                // so cannot be filled in, while nothing is selected.
                const medications = this.options.context?.medications ?? {};
                const isSendingAnyMedication = Object.values(medications).some(
                  medication => medication?.sendToPharmacy,
                );
                return !isSendingAnyMedication || Boolean(value);
              }),
          }),
          discharge: yup
            .object()
            .shape({
              dischargerId: foreignKey().translatedLabel(dischargingClinicianLabel),
              dispositionId: getLocalisedSchema({
                name: 'dischargeDisposition',
              }),
              note: dischargeNoteMandatory
                ? foreignKey().translatedLabel(
                    <TranslatedText
                      stringId="discharge.notes.label"
                      fallback="Discharge treatment plan and follow-up notes"
                    />,
                  )
                : yup.string().optional(),
            })
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="general.localisedField.dischargeDisposition.label"
                fallback="Discharge disposition"
              />,
            ),
        })}
        formProps={{
          enableReinitialize,
          showInlineErrorsOnly: true,
          validateOnChange: true,
        }}
        data-testid="paginatedform-ghn7"
      >
        <FormGrid data-testid="formgrid-menu">
          <EncounterOverview
            encounter={encounter}
            currentDiagnoses={currentDiagnoses}
            data-testid="encounteroverview-1swb"
          />
          <Field
            name="endDate"
            label={
              <TranslatedText stringId="discharge.dischargeDate.label" fallback="Discharge date" />
            }
            component={DateTimeField}
            min={encounter.startDate}
            required
            data-testid="field-20tt"
          />
          <Field
            name="discharge.dischargerId"
            label={dischargingClinicianLabel}
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
            data-testid="field-6we6"
          />
          <LocalisedField
            name="discharge.dispositionId"
            label={
              <TranslatedText
                stringId="general.localisedField.dischargeDisposition.label"
                fallback="Discharge disposition"
              />
            }
            path="fields.dischargeDisposition"
            component={AutocompleteField}
            suggester={dispositionSuggester}
            data-testid="localisedfield-d7fu"
          />
          <OuterLabelFieldWrapper
            label={<TranslatedText stringId="discharge.medications.label" fallback="Medications" />}
            style={{ gridColumn: '1 / -1' }}
            data-testid="outerlabelfieldwrapper-axm9"
          >
            <MedicationContainer>
              <MedicationHeader borderBottom={`1px solid ${Colors.outline}`}>
                <EncounterMedicationHeaderRow>
                  <TranslatedText
                    stringId="discharge.encounterMedication"
                    fallback="Encounter medication"
                  />
                  {isPharmacyOrderEnabled && (
                    <OrderingPrescriberField practitionerSuggester={practitionerSuggester} />
                  )}
                </EncounterMedicationHeaderRow>
              </MedicationHeader>
              <TableContainer>
                <TableFormFields
                  columns={MEDICATION_COLUMNS(medicationColumnOptions)}
                  data={activeMedications}
                  data-testid="tableformfields-i8q7"
                />
              </TableContainer>
              <MedicationHeader
                borderTop={`1px solid ${Colors.outline}`}
                borderBottom={`1px solid ${Colors.outline}`}
              >
                <TranslatedText
                  stringId="discharge.otherOngoingMedication"
                  fallback="Other ongoing medication"
                />
              </MedicationHeader>
              <TableContainer>
                <TableFormFields
                  columns={MEDICATION_COLUMNS(medicationColumnOptions)}
                  data={ongoingMedications}
                  data-testid="tableformfields-i8q7"
                />
              </TableContainer>
            </MedicationContainer>
          </OuterLabelFieldWrapper>

          <Field
            name="discharge.note"
            label={
              <TranslatedText
                stringId="discharge.notes.label"
                fallback="Discharge treatment plan and follow-up notes"
              />
            }
            component={TextField}
            multiline
            minRows={4}
            style={{ gridColumn: '1 / -1' }}
            required={dischargeNoteMandatory}
            data-testid="field-0uma"
          />
          {showEncounterSummary && (
            <div style={{ gridColumn: '1 / -1' }}>
              <EncounterSummaryContent encounterId={encounter.id} />
            </div>
          )}
          <Divider
            style={{ margin: '18px -32px 20px -32px', gridColumn: '1 / -1' }}
            data-testid="divider-lj2w"
          />
        </FormGrid>
      </PaginatedForm>
      {!!discontinuedMedication && (
        <MedicationDiscontinueModal
          medication={discontinuedMedication}
          onDiscontinue={onDiscontinueMedication}
          onClose={() => setDiscontinuedMedication(null)}
        />
      )}
    </>
  );
};
