import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { Box, FormControlLabel, Radio, RadioGroup } from '@material-ui/core';
import { Colors } from '../../constants';
import {
  TextField,
  ConfirmCancelBackRow,
  ConfirmCancelRow,
  BaseModal,
  TranslatedText,
} from '@tamanu/ui-components';
import { subHours } from 'date-fns';
import { ENCOUNTER_TYPES, PHARMACY_PRESCRIPTION_TYPES } from '@tamanu/constants';

import { AutocompleteInput } from '../Field';
import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';

import BasePharmacyIcon from '../../assets/images/pharmacy.svg?react';

import { notifyError } from '../../utils';
import { PharmacyOrderMedicationTable, COLUMN_KEYS } from './PharmacyOrderMedicationTable';
import { useSettings } from '../../contexts/Settings';
import { useEncounterMedicationQuery } from '../../api/queries/useEncounterMedicationQuery';
import { BodyText } from '../Typography';

const MODAL_TYPES = {
  REQUEST_CONFIRMATION: 'request_confirmation',
  REQUEST_SENT: 'request_sent',
  SEND_TO_PHARMACY: 'send_to_pharmacy',
};

const StyledModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: ${({ $modalType }) => {
    switch ($modalType) {
      case MODAL_TYPES.REQUEST_CONFIRMATION:
        return '670px';
      case MODAL_TYPES.REQUEST_SENT:
        return '580px';
      case MODAL_TYPES.SEND_TO_PHARMACY:
        return '1000px';
      default:
        return '1000px';
    }
  }};
  }
`;

const SubmitButtonsWrapper = styled.div`
  border-top: 1px solid ${Colors.outline};
  padding-top: 10px;
  margin-top: 20px;
`;

const PharmacyIcon = styled(BasePharmacyIcon)`
  width: 40%;
  height: 40%;
  margin-bottom: 30px;
`;

const OrderingClinicianWrapper = styled.div`
  width: 35%;
  margin-bottom: 20px;
  margin-top: 20px;
`;

const CommentsWrapper = styled.div`
  margin-top: 20px;
`;

const DialogPrimaryText = styled.div`
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 12px;
  text-align: center;
`;

const AlreadyOrderedPrimaryText = styled(DialogPrimaryText)`
  text-align: left;
`;

const DialogSecondaryText = styled.div`
  font-size: 14px;
  text-align: center;
  color: ${Colors.textSecondary};
  line-height: 1.4;
`;

const AlreadyOrderedSecondaryText = styled(DialogSecondaryText)`
  text-align: left;
`;

const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`;

const AlreadyOrderedContent = styled(DialogContent)`
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  padding: 20px 0px;
`;

const AlreadyOrderedMedicationsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 10px;
`;

const PrescriptionTypeWrapper = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
  font-size: 14px;
`;

const PrescriptionTypeLabel = styled.div`
  font-weight: 500;
  margin-bottom: 7px;
  color: ${Colors.darkText};
`;

const StyledRadioGroup = styled(RadioGroup)`
  flex-direction: row;
  gap: 10px;
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  .MuiTypography-body1 {
    font-size: 14px;
  }
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background: ${Colors.white};
  height: 44px;
  width: 202px;
  margin: 0;
  .MuiSvgIcon-root {
    font-size: 15px;
  }
`;

export const PharmacyOrderModal = React.memo(({ encounter, patient, ongoingPrescriptions, open, onClose, onSubmit }) => {
  // Determine if this is ongoing medications mode (no encounter, has patient and ongoingPrescriptions)
  const isOngoingMode = !encounter && !!patient && !!ongoingPrescriptions;

  const [orderingClinicianId, setOrderingClinicianId] = useState('');
  const [orderingClinicianError, setOrderingClinicianError] = useState(false);
  const [comments, setComments] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAlreadyOrderedConfirmation, setShowAlreadyOrderedConfirmation] = useState(false);
  const api = useApi();
  const queryClient = useQueryClient();
  const practitionerSuggester = useSuggester('practitioner');
  const { getSetting } = useSettings();
  const { facilityId, currentUser, ability } = useAuth();

  const medicationAlreadyOrderedConfirmationTimeout = getSetting(
    'features.pharmacyOrder.medicationAlreadyOrderedConfirmationTimeout',
  );

  const sendViaMSupply = getSetting('features.pharmacyOrder.sendViaMSupply');

  // Permission to edit repeats (only relevant for ongoing mode)
  const canEditRepeats = ability.can('write', 'Medication');

  const [prescriptionType, setPrescriptionType] = useState(
    PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT,
  );
  // In ongoing mode, always use discharge/outpatient
  const isDischargeOrOutpatient =
    isOngoingMode || prescriptionType === PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT;

  // Only fetch encounter medications if in encounter mode
  const {
    data,
    error,
    isLoading,
    refetch: refetchEncounterMedications,
  } = useEncounterMedicationQuery(encounter?.id);

  const initialPrescriptions = useMemo(() => {
    if (isOngoingMode) {
      // Use ongoing prescriptions passed as prop
      return (ongoingPrescriptions || [])
        .filter(p => !p.discontinued)
        .map(prescription => {
          const { repeats, lastOrderedAt, quantity } = prescription;
          return ({
            ...prescription,
            quantity,
            repeats: repeats ?? 0,
            selected: false,
            // Disable selection if no repeats remaining and has been ordered at least once
            // (users with write Medication permission can bypass this)
            isSelectionDisabled: !canEditRepeats && (prescription.repeats ?? 0) === 0 && lastOrderedAt,
          })
        });
    }
    // Use encounter medications from query
    return (
      data?.data
        ?.filter(p => !p.discontinued)
        .map(prescription => ({
          ...prescription,
          quantity: prescription.quantity ?? undefined,
          repeats: prescription.repeats ?? 0,
          selected: false,
        })) || []
    );
  }, [data, isOngoingMode, ongoingPrescriptions, canEditRepeats]);

  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);

  useEffect(() => {
    setPrescriptions(initialPrescriptions);
  }, [initialPrescriptions]);

  useEffect(() => {
    setOrderingClinicianId(currentUser.id);
  }, [currentUser]);

  // Set default prescription type based on encounter type when the modal opens
  // Only applies in encounter mode
  useEffect(() => {
    if (!open || !encounter?.encounterType || isOngoingMode) return;

    if (encounter.encounterType === ENCOUNTER_TYPES.CLINIC) {
      setPrescriptionType(PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT);
    } else {
      setPrescriptionType(PHARMACY_PRESCRIPTION_TYPES.INPATIENT);
    }
  }, [open, encounter?.encounterType, isOngoingMode]);

  const handleSelectAll = useCallback(event => {
    const checked = event.target.checked;
    setPrescriptions(prev =>
      prev.map(prescription => ({
        ...prescription,
        // Only select if not disabled (for ongoing mode with no repeats)
        selected: prescription.isSelectionDisabled ? false : checked,
      })),
    );
  }, []);

  const handleSelectRow = useCallback(
    rowIndex => event => {
      const checked = event.target.checked;
      setPrescriptions(prev => {
        const newPrescriptions = [...prev];
        // Only allow selection if not disabled
        if (!newPrescriptions[rowIndex].isSelectionDisabled) {
          newPrescriptions[rowIndex] = {
            ...newPrescriptions[rowIndex],
            selected: checked,
          };
        }
        return newPrescriptions;
      });
    },
    [],
  );

  const getAlreadyOrderedPrescriptions = useCallback(
    () =>
      prescriptions.filter(
        p =>
          p.selected &&
          p.lastOrderedAt &&
          new Date(p.lastOrderedAt) >
          subHours(new Date(), medicationAlreadyOrderedConfirmationTimeout),
      ),
    [prescriptions, medicationAlreadyOrderedConfirmationTimeout],
  );

  const selectAllChecked = useMemo(() => {
    const selectablePrescriptions = prescriptions.filter(p => !p.isSelectionDisabled);
    return selectablePrescriptions.length > 0 && selectablePrescriptions.every(p => p.selected);
  }, [prescriptions]);

  const cellOnChange = useCallback(
    (event, key, rowIndex) => {
      if (key !== COLUMN_KEYS.QUANTITY) return;

      const newMedicationData = [...prescriptions];
      const rawValue = event.target.value;
      const value =
        rawValue === '' || rawValue === null || rawValue === undefined
          ? undefined
          : parseInt(rawValue, 10);

      newMedicationData[rowIndex] = {
        ...newMedicationData[rowIndex],
        quantity: value,
        hasError: !value,
      };

      setPrescriptions(newMedicationData);
    },
    [prescriptions],
  );

  const validateForm = useCallback(() => {
    const selectedPrescriptions = prescriptions.filter(p => p.selected);
    if (selectedPrescriptions.length === 0) {
      notifyError('Please select at least one medication to send to the pharmacy');
      return false;
    }

    const hasInvalidQuantities = selectedPrescriptions.some(p => !p.quantity || p.quantity <= 0);
    if (hasInvalidQuantities) {
      setPrescriptions(prev =>
        prev.map(p => ({
          ...p,
          hasError: p.selected && (!p.quantity || p.quantity <= 0),
        })),
      );
    }

    if (!orderingClinicianId) setOrderingClinicianError(true);

    const isValidFormData = !hasInvalidQuantities && orderingClinicianId;
    return isValidFormData;
  }, [prescriptions, orderingClinicianId]);

  const submitOrder = useCallback(async () => {
    try {
      const selectedPrescriptions = prescriptions.filter(p => p.selected);

      if (isOngoingMode) {
        // Send ongoing medications to pharmacy (creates automatic encounter)
        const orderData = {
          patientId: patient.id,
          orderingClinicianId,
          comments,
          facilityId,
          prescriptions: selectedPrescriptions.map(prescription => ({
            prescriptionId: prescription.id,
            quantity: prescription.quantity,
            repeats: prescription.repeats,
          })),
        };

        await api.post('medication/send-ongoing-to-pharmacy', orderData);
        await queryClient.invalidateQueries(['patient-ongoing-prescriptions', patient.id]);
      } else {
        // Standard encounter-based pharmacy order
        const orderData = {
          encounterId: encounter.id,
          orderingClinicianId,
          comments,
          isDischargePrescription: isDischargeOrOutpatient,
          facilityId,
          pharmacyOrderPrescriptions: selectedPrescriptions.map(prescription => ({
            prescriptionId: prescription.id,
            quantity: prescription.quantity,
            repeats: prescription.repeats,
          })),
        };

        await api.post(`encounter/${encounter.id}/pharmacyOrder`, orderData);
        await queryClient.invalidateQueries(['encounterMedication', encounter.id]);
        refetchEncounterMedications();
      }

      onSubmit();
      setShowSuccess(true);
    } catch (err) {
      notifyError(err.message);
    }
  }, [
    queryClient,
    isOngoingMode,
    patient?.id,
    encounter?.id,
    orderingClinicianId,
    comments,
    isDischargeOrOutpatient,
    facilityId,
    prescriptions,
    api,
    refetchEncounterMedications,
    onSubmit,
  ]);

  const handleSendOrder = useCallback(() => {
    if (!validateForm()) return;

    if (getAlreadyOrderedPrescriptions().length > 0) {
      setShowAlreadyOrderedConfirmation(true);
      return;
    }

    submitOrder();
  }, [validateForm, getAlreadyOrderedPrescriptions, submitOrder]);

  const handleClose = useCallback(() => {
    setTimeout(() => {
      setShowSuccess(false);
      setShowAlreadyOrderedConfirmation(false);
      setComments('');
      onClose();
    }, 200);
  }, [onClose]);

  // Prepare data with select handlers
  const tableData = useMemo(
    () =>
      prescriptions.map((prescription, index) => ({
        ...prescription,
        onSelect: handleSelectRow(index),
      })),
    [prescriptions, handleSelectRow],
  );

  const mainTableColumns = useMemo(() => {
    const columns = [
      COLUMN_KEYS.SELECT,
      COLUMN_KEYS.MEDICATION,
      COLUMN_KEYS.DOSE,
      COLUMN_KEYS.FREQUENCY,
    ];
    if (isDischargeOrOutpatient && !isOngoingMode) {
      columns.push(COLUMN_KEYS.DURATION);
    }
    columns.push(COLUMN_KEYS.DATE, COLUMN_KEYS.LAST_SENT, COLUMN_KEYS.QUANTITY);
    if (isDischargeOrOutpatient) {
      columns.push(COLUMN_KEYS.REPEATS);
    }
    return columns;
  }, [isDischargeOrOutpatient, isOngoingMode]);

  if (showSuccess) {
    return (
      <StyledModal
        title={<TranslatedText stringId="pharmacyOrder.success.title" fallback="Request sent" />}
        open={open}
        onClose={handleClose}
        $modalType={MODAL_TYPES.REQUEST_SENT}
      >
        <DialogContent>
          <PharmacyIcon alt="Pharmacy" />
          <DialogPrimaryText>
            <TranslatedText
              stringId="pharmacyOrder.success.message"
              fallback="Your order has been sent to pharmacy."
            />
          </DialogPrimaryText>
          <DialogSecondaryText>
            <TranslatedText
              stringId="pharmacyOrder.success.description"
              fallback="Please do not send additional requests for these item/s until the original request has been filled by pharmacy."
            />
          </DialogSecondaryText>
        </DialogContent>

        <SubmitButtonsWrapper>
          <ConfirmCancelRow
            confirmText={
              <TranslatedText
                stringId="general.action.close"
                fallback="Close"
                data-testid="translatedtext-close"
              />
            }
            onConfirm={handleClose}
            data-testid="confirmcancelrow-success"
          />
        </SubmitButtonsWrapper>
      </StyledModal>
    );
  }

  if (showAlreadyOrderedConfirmation) {
    return (
      <StyledModal
        title={
          <TranslatedText
            stringId="pharmacyOrder.orderConfirmation.title"
            fallback="Request confirmation"
          />
        }
        open={open}
        onClose={handleClose}
        $modalType={MODAL_TYPES.REQUEST_CONFIRMATION}
      >
        <AlreadyOrderedContent>
          <AlreadyOrderedPrimaryText>
            {medicationAlreadyOrderedConfirmationTimeout === 1 ? (
              <TranslatedText
                stringId="pharmacyOrder.orderConfirmation.message.singleHour"
                fallback="The above medications have already been sent within the past hour"
              />
            ) : (
              <TranslatedText
                stringId="pharmacyOrder.orderConfirmation.message.multipleHours"
                fallback="The above medications have already been sent within the past :medicationAlreadyOrderedConfirmationTimeout hours"
                replacements={{ medicationAlreadyOrderedConfirmationTimeout }}
              />
            )}
          </AlreadyOrderedPrimaryText>
          <AlreadyOrderedSecondaryText>
            <TranslatedText
              stringId="pharmacyOrder.orderConfirmation.secondaryMessage"
              fallback="Please confirm that you would like to proceed with including these items in your order. Please click 'Back' if you would like to amend your order."
            />
          </AlreadyOrderedSecondaryText>
        </AlreadyOrderedContent>

        <AlreadyOrderedMedicationsWrapper>
          <PharmacyOrderMedicationTable
            data={getAlreadyOrderedPrescriptions()}
            error={isOngoingMode ? null : error}
            isLoading={isOngoingMode ? false : isLoading}
            cellOnChange={cellOnChange}
            handleSelectAll={handleSelectAll}
            selectAllChecked={selectAllChecked}
            columnsToInclude={[COLUMN_KEYS.MEDICATION, COLUMN_KEYS.DATE, COLUMN_KEYS.LAST_SENT]}
          />
        </AlreadyOrderedMedicationsWrapper>

        <SubmitButtonsWrapper>
          <ConfirmCancelBackRow
            onBack={() => setShowAlreadyOrderedConfirmation(false)}
            onCancel={handleClose}
            onConfirm={handleSendOrder}
            data-testid="confirmcancelrow-7g3j"
          />
        </SubmitButtonsWrapper>
      </StyledModal>
    );
  }

  return (
    <StyledModal
      title={<TranslatedText stringId="pharmacyOrder.title" fallback="Send to pharmacy" />}
      open={open}
      onClose={handleClose}
      $modalType={MODAL_TYPES.SEND_TO_PHARMACY}
    >
      <BodyText color={Colors.darkText} fontWeight={500}>
        <TranslatedText
          stringId={
            isOngoingMode
              ? 'pharmacyOrder.ongoing.description.base'
              : 'pharmacyOrder.description.base'
          }
          fallback={
            isOngoingMode
              ? 'Select the ongoing medications you would like to send to the pharmacy'
              : 'Select the prescriptions you would like to send to the pharmacy'
          }
          data-testid="translatedtext-rnjt"
        />
        {sendViaMSupply && (
          <>
            {' '}
            <TranslatedText
              stringId="pharmacyOrder.description.viaMSupply"
              fallback="(via mSupply)"
              data-testid="translatedtext-qweq"
            />
          </>
        )}
      </BodyText>
      <Box display="flex" justifyContent="space-between" alignItems="end">
        <OrderingClinicianWrapper data-testid="orderingclinicianwrapper-r57g">
          <AutocompleteInput
            infoTooltip={
              <Box width="150px">
                <TranslatedText
                  stringId="pharmacyOrder.orderingClinician.tooltip"
                  fallback="The clinician who is placing the pharmacy order."
                  data-testid="translatedtext-s7yn"
                />
              </Box>
            }
            name="orderingClinicianId"
            label={
              <TranslatedText
                stringId="pharmacyOrder.orderingClinician.label"
                fallback="Ordering clinician"
                data-testid="translatedtext-aemx"
              />
            }
            suggester={practitionerSuggester}
            onChange={event => {
              setOrderingClinicianId(event.target.value);
              setOrderingClinicianError(false);
            }}
            value={orderingClinicianId}
            error={orderingClinicianError}
            helperText={
              orderingClinicianError && (
                <TranslatedText
                  stringId="validation.required.inline"
                  fallback="*Required"
                />
              )
            }
            required
            data-testid="autocompleteinput-ampt"
          />
        </OrderingClinicianWrapper>

        {!isOngoingMode && (
          <PrescriptionTypeWrapper>
            <PrescriptionTypeLabel>
              <TranslatedText
                stringId="pharmacyOrder.prescriptionType.label"
                fallback="Prescription type"
              />
            </PrescriptionTypeLabel>
            <StyledRadioGroup
              name="pharmacy-prescription-type"
              value={prescriptionType}
              onChange={event => {
                setPrescriptionType(event.target.value);
              }}
            >
              <StyledFormControlLabel
                value={PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT}
                control={<Radio color="primary" size="small" />}
                label={
                  <TranslatedText
                    stringId="pharmacyOrder.prescriptionType.outpatientDischarge"
                    fallback="Outpatient/Discharge"
                  />
                }
              />
              <StyledFormControlLabel
                value={PHARMACY_PRESCRIPTION_TYPES.INPATIENT}
                control={<Radio color="primary" size="small" />}
                label={
                  <TranslatedText
                    stringId="pharmacyOrder.prescriptionType.inpatient"
                    fallback="Inpatient"
                  />
                }
              />
            </StyledRadioGroup>
          </PrescriptionTypeWrapper>
        )}
      </Box>
      <PharmacyOrderMedicationTable
        data={tableData}
        error={isOngoingMode ? null : error}
        isLoading={isOngoingMode ? false : isLoading}
        cellOnChange={cellOnChange}
        handleSelectAll={handleSelectAll}
        selectAllChecked={selectAllChecked}
        columnsToInclude={mainTableColumns}
        isOngoingMode={isOngoingMode}
        disabledPrescriptionIds={prescriptions.filter(p => p.isSelectionDisabled).map(p => p.id)}
      />

      <CommentsWrapper>
        <TextField
          field={{
            name: 'comments',
            value: comments,
            onChange: e => setComments(e.target.value),
          }}
          label={
            <TranslatedText
              stringId="pharmacyOrder.comments.label"
              fallback="Comments"
              data-testid="translatedtext-comments"
            />
          }
          multiline
          rows={3}
          data-testid="textfield-comments"
        />
      </CommentsWrapper>

      <SubmitButtonsWrapper>
        <ConfirmCancelRow
          confirmText={
            <TranslatedText
              stringId="pharmacyOrder.action.send"
              fallback="Send"
              data-testid="translatedtext-ojsa"
            />
          }
          confirmDisabled={!prescriptions.some(p => p.selected)}
          onConfirm={handleSendOrder}
          onCancel={handleClose}
          data-testid="confirmcancelrow-9lo1"
        />
      </SubmitButtonsWrapper>
    </StyledModal>
  );
});

PharmacyOrderModal.propTypes = {
  encounter: PropTypes.object,
  patient: PropTypes.object,
  ongoingPrescriptions: PropTypes.array,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

PharmacyOrderModal.defaultProps = {
  encounter: null,
  patient: null,
  ongoingPrescriptions: null,
};
