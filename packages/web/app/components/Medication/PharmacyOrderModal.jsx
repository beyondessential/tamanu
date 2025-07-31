import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';

import { AutocompleteInput, TextField } from '../Field';
import { ConfirmCancelBackRow, ConfirmCancelRow } from '../ButtonRow';
import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { Colors } from '../../constants';
import { pharmacyIcon } from '../../constants/images';

import { TranslatedText } from '../Translation';
import { BaseModal } from '../BaseModal';
import { notifyError } from '../../utils';
import { PharmacyOrderMedicationTable, COLUMN_KEYS } from './PharmacyOrderMedicationTable';
import { useSettings } from '../../contexts/Settings';
import { subHours } from 'date-fns';
import { useEncounterMedicationQuery } from '../../api/queries/useEncounterMedicationQuery';

const StyledModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 1000px;
  }
`;

const PharmacyIcon = styled.img`
  width: 40%;
  height: 40%;
  margin-bottom: 30px;
`;

const OrderingClinicianWrapper = styled.div`
  width: 25%;
  margin-bottom: 20px;
  margin-top: 20px;
`;

const HorizontalDivider = styled(Divider)`
  margin: 30px 0;
`;

const CommentsWrapper = styled.div`
  margin-bottom: 20px;
  margin-top: 20px;
`;

const DialogPrimaryText = styled.div`
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 12px;
  text-align: center;
`;

const DialogSecondaryText = styled.div`
  font-size: 14px;
  text-align: center;
  color: ${Colors.textSecondary};
  line-height: 1.4;
`;

const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`;

const AlreadyOrderedMedicationsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-left: 80px;
  padding-right: 80px;
`;

export const PharmacyOrderModal = React.memo(({ encounter, open, onClose, onSubmit }) => {
  const [orderingClinicianId, setOrderingClinicianId] = useState(null);
  const [comments, setComments] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAlreadyOrderedConfirmation, setShowAlreadyOrderedConfirmation] = useState(false);
  const api = useApi();
  const queryClient = useQueryClient();
  const practitionerSuggester = useSuggester('practitioner');
  const { getSetting } = useSettings();

  const medicationAlreadyOrderedConfirmationTimeout = getSetting(
    'features.pharmacyOrder.medicationAlreadyOrderedConfirmationTimeout',
  );

  const {
    data,
    error,
    isLoading,
    refetch: refetchEncounterMedications,
  } = useEncounterMedicationQuery(encounter.id);

  const initialPrescriptions = useMemo(
    () =>
      data?.data
        .filter(p => !p.discontinued)
        .map(prescription => ({
          ...prescription,
          quantity: 1,
          repeats: undefined,
          selected: true,
        })) || [],
    [data],
  );

  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);

  useEffect(() => {
    setPrescriptions(initialPrescriptions);
  }, [initialPrescriptions]);

  const { currentUser } = useAuth();

  useEffect(() => {
    setOrderingClinicianId(currentUser.id);
  }, [currentUser]);

  const handleSelectAll = useCallback(event => {
    const checked = event.target.checked;
    setPrescriptions(prev =>
      prev.map(prescription => ({
        ...prescription,
        selected: checked,
      })),
    );
  }, []);

  const handleSelectRow = useCallback(
    rowIndex => event => {
      const checked = event.target.checked;
      setPrescriptions(prev => {
        const newPrescriptions = [...prev];
        newPrescriptions[rowIndex] = {
          ...newPrescriptions[rowIndex],
          selected: checked,
        };
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
    return prescriptions.length > 0 && prescriptions.every(p => p.selected);
  }, [prescriptions]);

  const cellOnChange = useCallback(
    (event, key, rowIndex) => {
      if ([COLUMN_KEYS.QUANTITY, COLUMN_KEYS.REPEATS].includes(key)) {
        const newMedicationData = [...prescriptions];
        const value = parseInt(event.target.value, 10) || undefined;

        newMedicationData[rowIndex] = {
          ...newMedicationData[rowIndex],
          [key]: value,
          hasError: key === COLUMN_KEYS.QUANTITY && !value,
        };
        setPrescriptions(newMedicationData);
      }
    },
    [prescriptions],
  );

  const validateForm = useCallback(() => {
    const selectedPrescriptions = prescriptions.filter(p => p.selected);
    const hasValidQuantities = selectedPrescriptions.every(p => p.quantity && p.quantity > 0);
    const hasOrderingClinician = orderingClinicianId;
    const hasSelectedPrescriptions = selectedPrescriptions.length > 0;

    return hasValidQuantities && hasOrderingClinician && hasSelectedPrescriptions;
  }, [prescriptions, orderingClinicianId]);

  const handleSendOrder = useCallback(async () => {
    if (!validateForm()) return;

    try {
      const selectedPrescriptions = prescriptions.filter(p => p.selected);
      const orderData = {
        encounterId: encounter.id,
        orderingClinicianId,
        comments,
        pharmacyOrderPrescriptions: selectedPrescriptions.map(prescription => ({
          prescriptionId: prescription.id,
          quantity: prescription.quantity,
          repeats: prescription.repeats,
        })),
      };

      await api.post(`encounter/${encounter.id}/pharmacyOrder`, orderData);
      await queryClient.invalidateQueries(['encounterMedication', encounter.id]);
      refetchEncounterMedications();
      onSubmit();
      setShowSuccess(true);
    } catch (error) {
      notifyError(error.message);
    }
  }, [
    validateForm,
    queryClient,
    encounter.id,
    orderingClinicianId,
    comments,
    prescriptions,
    api,
    refetchEncounterMedications,
    onSubmit,
  ]);

  const handleClickSend = useCallback(() => {
    if (!validateForm()) return;

    if (getAlreadyOrderedPrescriptions().length > 0) {
      setShowAlreadyOrderedConfirmation(true);
      return;
    }

    handleSendOrder();
  }, [validateForm, handleSendOrder, getAlreadyOrderedPrescriptions]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setShowSuccess(false);
      setShowAlreadyOrderedConfirmation(false);
      setComments('');
      setPrescriptions(initialPrescriptions);
    }, 200);
  }, [initialPrescriptions, onClose]);

  const isFormValid = validateForm();

  // Prepare data with select handlers
  const tableData = useMemo(
    () =>
      prescriptions.map((prescription, index) => ({
        ...prescription,
        onSelect: handleSelectRow(index),
      })),
    [prescriptions, handleSelectRow],
  );

  if (showSuccess) {
    return (
      <StyledModal
        title={<TranslatedText stringId="pharmacyOrder.success.title" fallback="Order requested" />}
        open={open}
        onClose={handleClose}
      >
        <DialogContent>
          <PharmacyIcon src={pharmacyIcon} alt="Pharmacy" />
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
      </StyledModal>
    );
  }

  if (showAlreadyOrderedConfirmation) {
    return (
      <StyledModal
        title={
          <TranslatedText
            stringId="pharmacyOrder.orderConfirmation.title"
            fallback="Order confirmation"
          />
        }
        open={open}
        onClose={handleClose}
      >
        <AlreadyOrderedMedicationsWrapper>
          <PharmacyOrderMedicationTable
            data={tableData}
            error={error}
            isLoading={isLoading}
            cellOnChange={cellOnChange}
            handleSelectAll={handleSelectAll}
            selectAllChecked={selectAllChecked}
            columnsToInclude={[COLUMN_KEYS.MEDICATION, COLUMN_KEYS.DATE, COLUMN_KEYS.LAST_ORDERED]}
          />
        </AlreadyOrderedMedicationsWrapper>

        <DialogContent>
          <DialogPrimaryText>
            <TranslatedText
              stringId="pharmacyOrder.orderConfirmation.message"
              fallback="The above medications have already been ordered within the past :medicationAlreadyOrderedConfirmationTimeout hours"
              replacements={{ medicationAlreadyOrderedConfirmationTimeout }}
            />
          </DialogPrimaryText>
          <DialogSecondaryText>
            <TranslatedText
              stringId="pharmacyOrder.orderConfirmation.secondaryMessage"
              fallback="Please confirm that you would like to proceed with including these items in your order. Please click 'Back' if you would like to amend your order."
            />
          </DialogSecondaryText>
        </DialogContent>
        <ConfirmCancelBackRow
          onBack={() => setShowAlreadyOrderedConfirmation(false)}
          onCancel={handleClose}
          onConfirm={handleSendOrder}
          data-testid="confirmcancelrow-7g3j"
        />
      </StyledModal>
    );
  }

  return (
    <StyledModal
      title={<TranslatedText stringId="pharmacyOrder.title" fallback="Pharmacy order" />}
      open={open}
      onClose={handleClose}
    >
      <TranslatedText
        stringId="pharmacyOrder.description"
        fallback="Select the prescriptions you would like to send to pharmacy (via mSupply)"
        data-testid="translatedtext-rnjt"
      />
      <OrderingClinicianWrapper data-testid="orderingclinicianwrapper-r57g">
        <AutocompleteInput
          infoTooltip={
            <Box width="200px">
              <TranslatedText
                stringId="pharmacyOrder.orderingClinician.tooltip"
                fallback="The clinician who is placing this pharmacy order"
                data-testid="translatedtext-s7yn"
              />
            </Box>
          }
          name="orderingClinicianId"
          label={
            <TranslatedText
              stringId="pharmacyOrder.orderingClinician.label"
              fallback="Ordering Clinician"
              data-testid="translatedtext-aemx"
            />
          }
          suggester={practitionerSuggester}
          onChange={event => setOrderingClinicianId(event.target.value)}
          value={orderingClinicianId}
          required
          data-testid="autocompleteinput-ampt"
        />
      </OrderingClinicianWrapper>

      <PharmacyOrderMedicationTable
        data={tableData}
        error={error}
        isLoading={isLoading}
        cellOnChange={cellOnChange}
        handleSelectAll={handleSelectAll}
        selectAllChecked={selectAllChecked}
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

      <HorizontalDivider color={Colors.outline} />

      <ConfirmCancelRow
        confirmText={
          <TranslatedText
            stringId="pharmacyOrder.action.send"
            fallback="Send"
            data-testid="translatedtext-ojsa"
          />
        }
        confirmDisabled={!isFormValid}
        onConfirm={handleClickSend}
        onCancel={handleClose}
        data-testid="confirmcancelrow-9lo1"
      />
    </StyledModal>
  );
});

PharmacyOrderModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
