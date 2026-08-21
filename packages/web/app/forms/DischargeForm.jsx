/* eslint-disable react-hooks/exhaustive-deps */
import { Box } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import { useFormikContext } from 'formik';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { toast } from 'react-toastify';

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
import { useEncounterDischargeDraftQuery } from '../api/queries/useEncounterDischargeDraftQuery';
import { useEncounterDischargeDraftMutation } from '../api/mutations/useEncounterDischargeDraftMutation';
import { useEncounterMedicationQuery } from '../api/queries/useEncounterMedicationQuery';
import { usePatientOngoingPrescriptionsQuery } from '../api/queries/usePatientOngoingPrescriptionsQuery';
import { EncounterSummaryContent } from '../components/EncounterSummary';
import { LocalisedField, PaginatedForm, useLocalisedSchema } from '../components/Field';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { MedicationDiscontinueModal } from '../components/Medication/MedicationDiscontinueModal';
import { TableFormFields } from '../components/Table';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { useEncounter } from '../contexts/Encounter';
import { createPrescriptionHash } from '../utils/medications';
import { foreignKey } from '../utils/validation';
import { EncounterOverview } from './DischargeEncounterOverview';
import {
  buildDischargeNote,
  buildMedicationsInitialValues,
  toDischargeDraftPayload,
} from './dischargeDraft';
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
  draft,
  dischargeNotes,
  medicationInitialValues,
  getCurrentDateTime,
  storedDateTimeToEpochMilliseconds,
}) => {
  const encounterStartMs = storedDateTimeToEpochMilliseconds(encounter.startDate);

  const getInitialEndDate = () => {
    if (!draft) {
      if (encounterStartMs != null && encounterStartMs > Date.now()) {
        const primaryNow = getCurrentDateTime();
        const time = trimToTime(primaryNow);
        return time ? `${trimToDate(encounter.startDate)} ${time}` : primaryNow;
      } else {
        return getCurrentDateTime();
      }
    }
    return draft.endDate;
  };

  // Whether a draft exists decides these, not whether its field is set: a clinician who cleared
  // the discharging clinician before saving gets it back cleared, the same way the medication
  // rows keep an emptied quantity empty. Only a form with no draft falls back to the live default.
  return {
    endDate: getInitialEndDate(),
    discharge: {
      dischargerId: draft ? (draft.dischargerId ?? null) : currentUser?.id,
      dispositionId: draft?.dispositionId ?? null,
      note: buildDischargeNote({ draft, dischargeNotes }),
    },
    pharmacyOrder: {
      orderingClinicianId: draft ? (draft.orderingClinicianId ?? null) : currentUser?.id,
    },
    medications: medicationInitialValues,
    submittedTime: getCurrentDateTime(),
  };
};

/**
 * Keeps the form's per-medication values in step with the medications actually listed, without
 * touching any other field. When a medication is discontinued it drops out of the list, so its
 * entry is removed here rather than by reinitialising the whole form — which would otherwise revert
 * the user's edits to sibling fields such as the ordering prescriber.
 */
const ReconcileMedicationValues = ({ medicationInitialValues }) => {
  const { values, setFieldValue } = useFormikContext();
  const medicationIdsKey = Object.keys(medicationInitialValues).sort().join(',');

  useEffect(() => {
    const currentValues = values.medications ?? {};
    const reconciled = {};
    for (const id of Object.keys(medicationInitialValues)) {
      // Preserve the clinician's edits for medications still listed; seed defaults for new ones.
      reconciled[id] = currentValues[id] ?? medicationInitialValues[id];
    }
    const currentKeys = Object.keys(currentValues);
    const hasStaleEntry = currentKeys.some(id => !(id in reconciled));
    if (currentKeys.length !== Object.keys(reconciled).length || hasStaleEntry) {
      setFieldValue('medications', reconciled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicationIdsKey]);

  return null;
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
  const [dischargeNotesFailed, setDischargeNotesFailed] = useState(false);
  const [showWarningScreen, setShowWarningScreen] = useState(false);
  const [discontinuedMedication, setDiscontinuedMedication] = useState(null);
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

  const { data: encounterMedications, isLoading: isLoadingEncounterMedications } =
    useEncounterMedicationQuery(encounter.id);
  const { data: ongoingPrescriptions, isLoading: isLoadingOngoingPrescriptions } =
    usePatientOngoingPrescriptionsQuery(encounter.patientId, facilityId);
  const { data: dischargeDraftData, isFetched: isDischargeDraftFetched } =
    useEncounterDischargeDraftQuery(encounter.id);
  const draft = dischargeDraftData?.draft ?? null;

  // The form is initialised once from data that arrives asynchronously — encounter medications,
  // ongoing prescriptions, the saved draft, and discharge notes. Waiting for all of it before
  // mounting means the form never needs to reinitialise later, so a medication being discontinued
  // can't clobber the clinician's edits to fields like the ordering prescriber, and the draft is
  // never seeded over by live data.
  //
  // The draft is gated on having settled rather than on having arrived: a query that ends in error
  // never yields data, and the form still has to open.
  //
  // The gate is one-way. Rendering a loader in place of the form swaps the element type at this
  // position, which unmounts Formik and loses every edit the clinician has made; going back to
  // loading after the form is up would re-mount it against freshly defaulted initial values.
  const hasInitialData =
    !isLoadingEncounterMedications &&
    !isLoadingOngoingPrescriptions &&
    isDischargeDraftFetched &&
    dischargeNotes !== null;
  const [isInitialDataReady, setIsInitialDataReady] = useState(false);
  if (hasInitialData && !isInitialDataReady) {
    setIsInitialDataReady(true);
  }

  const activeMedications = (encounterMedications?.data || []).filter(
    medication => !medication.discontinued,
  );

  const activeMedicationHashes = new Set(activeMedications.map(createPrescriptionHash));
  const ongoingMedications = (ongoingPrescriptions?.data || []).filter(
    p => !p.discontinued && !activeMedicationHashes.has(createPrescriptionHash(p)),
  );
  const medicationInitialValues = buildMedicationsInitialValues({
    encounterMedications: activeMedications,
    ongoingMedications,
    draft,
    isPharmacyOrderEnabled,
  });

  // Stock is only recorded against a facility's drug list, so the column is dropped entirely where
  // nothing on this discharge has a status to show — matching the dispense medication modal.
  const showStockColumn = [...activeMedications, ...ongoingMedications].some(
    medication => medication.medication?.referenceDrug?.facilities?.[0]?.stockStatus,
  );

  const { saveDraft, discardDraft, forgetDraft } = useEncounterDischargeDraftMutation(
    encounter.id,
    { onSuccess: onCancel },
  );

  const handleSubmit = useCallback(
    async data => {
      // The server takes the order's facility from the discharging user's token, so only the
      // ordering prescriber travels with the request.
      const submitData = isPharmacyOrderEnabled ? data : { ...data, pharmacyOrder: undefined };
      await onSubmit(submitData);
      // Discharging clears every draft on the encounter, so the cached copy is gone too.
      forgetDraft();
    },
    [onSubmit, isPharmacyOrderEnabled, forgetDraft],
  );

  // A failed save is the one failure this feature cannot swallow: the whole point is not losing
  // the clinician's text, so the modal stays open and says so rather than closing on nothing.
  const handleSaveDraft = useCallback(
    async values => {
      try {
        await saveDraft(toDischargeDraftPayload({ values, dischargeNotes, isPharmacyOrderEnabled }));
      } catch (error) {
        toast.error(
          <TranslatedText
            stringId="discharge.draft.saveFailed.message"
            fallback="Could not save the discharge draft. Your changes are still here, try again."
          />,
        );
      }
    },
    [saveDraft, dischargeNotes, isPharmacyOrderEnabled],
  );

  const handleDiscardDraft = useCallback(async () => {
    try {
      await discardDraft();
    } catch (error) {
      toast.error(
        <TranslatedText
          stringId="discharge.draft.discardFailed.message"
          fallback="Could not discard the discharge draft. Try again."
        />,
      );
    }
  }, [discardDraft]);

  useEffect(() => {
    (async () => {
      try {
        const { data: notes } = await api.get(`encounter/${encounter.id}/notes`);
        setDischargeNotes(notes.filter(n => n.noteTypeId === NOTE_TYPES.DISCHARGE).reverse()); // reverse order of array to sort by oldest first
        setDischargeNotesFailed(false);
      } catch (e) {
        // Settling on an empty list keeps the form usable: leaving this null would hold the form
        // behind its loading gate for good. The failure is tracked separately because an empty
        // list here would otherwise be indistinguishable from an admission with no planning
        // notes, and discharging on that assumption would drop them.
        setDischargeNotes([]);
        setDischargeNotesFailed(true);
      }
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

  if (!isInitialDataReady) {
    return <LoadingIndicator data-testid="dischargeform-loading" />;
  }

  return (
    <>
      <PaginatedForm
        onSubmit={handleSubmit}
        onCancel={onCancel}
        initialValues={getDischargeInitialValues({
          encounter,
          currentUser,
          draft,
          dischargeNotes,
          medicationInitialValues,
          getCurrentDateTime,
          storedDateTimeToEpochMilliseconds,
        })}
        FormScreen={props => (
          <DischargeFormScreen
            {...props}
            currentDiagnoses={currentDiagnoses}
            onSaveDraft={handleSaveDraft}
            setShowWarningScreen={setShowWarningScreen}
            dischargeNotesFailed={dischargeNotesFailed}
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
                  // Returning to the form has to clear the flag as well as step back, or the
                  // summary screen stays stuck on this one and the discharge can never be
                  // confirmed for the rest of the modal session.
                  onStepBack={() => {
                    setShowWarningScreen(false);
                    props.onStepBack();
                  }}
                  onSaveDraft={handleSaveDraft}
                  onDiscardDraft={handleDiscardDraft}
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
              }).nullable(),
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
          enableReinitialize: false,
          showInlineErrorsOnly: true,
          validateOnChange: true,
        }}
        data-testid="paginatedform-ghn7"
      >
        <FormGrid data-testid="formgrid-menu">
          <ReconcileMedicationValues medicationInitialValues={medicationInitialValues} />
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
