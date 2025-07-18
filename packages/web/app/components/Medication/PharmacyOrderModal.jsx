import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';

import { Table } from '../Table';
import {
  AutocompleteInput,
  NumberInput,
  OuterLabelFieldWrapper,
  TextField,
  TextInput,
  CheckInput,
} from '../Field';
import { ConfirmCancelRow } from '../ButtonRow';
import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { Colors } from '../../constants';
import { pharmacyIcon } from '../../constants/images';

import { TranslatedText, TranslatedReferenceData } from '../Translation';
import { useTranslation } from '../../contexts/Translation';
import { formatShortest } from '@tamanu/utils/dateTime';
import { getDose, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { BaseModal } from '../BaseModal';
import { notifyError } from '../../utils';

const StyledModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 900px;
  }
`;

const PharmacyIcon = styled.img`
  width: 40%;
  height: 40%;
  margin-bottom: 30px;
`;

const COLUMN_KEYS = {
  SELECT: 'select',
  DATE: 'date',
  MEDICATION: 'medication',
  DOSE: 'dose',
  FREQUENCY: 'frequency',
  QUANTITY: 'quantity',
  REPEATS: 'repeats',
};

const COLUMNS = (getTranslation, getEnumTranslation, onSelectAll, selectAllChecked) => [
  {
    key: COLUMN_KEYS.SELECT,
    title: (
      <CheckInput
        value={selectAllChecked}
        onChange={onSelectAll}
        style={{ margin: 'auto' }}
        data-testid="select-all-checkbox"
      />
    ),
    sortable: false,
    maxWidth: 50,
    accessor: ({ selected, onSelect }) => (
      <CheckInput
        value={selected}
        onChange={onSelect}
        style={{ margin: 'auto' }}
        data-testid="prescription-checkbox"
      />
    ),
  },

  {
    key: COLUMN_KEYS.MEDICATION,
    title: (
      <TranslatedText
        stringId="medication.medication.label"
        fallback="Medication"
        data-testid="translatedtext-fmmr"
      />
    ),
    sortable: false,
    maxWidth: 300,
    accessor: ({ medication }) => (
      <TranslatedReferenceData
        fallback={medication.name}
        value={medication.id}
        category={medication.type}
        data-testid="translatedreferencedata-sv6j"
      />
    ),
  },
  {
    key: COLUMN_KEYS.DOSE,
    title: (
      <TranslatedText
        stringId="medication.dose.label"
        fallback="Dose"
        data-testid="translatedtext-dose"
      />
    ),
    sortable: false,
    accessor: ({ doseAmount, units, isVariableDose }) =>
      getDose({ doseAmount, units, isVariableDose }, getTranslation, getEnumTranslation),
  },
  {
    key: COLUMN_KEYS.FREQUENCY,
    title: (
      <TranslatedText
        stringId="medication.frequency.label"
        fallback="Frequency"
        data-testid="translatedtext-frequency"
      />
    ),
    sortable: false,
    accessor: ({ frequency }) =>
      frequency ? getTranslatedFrequency(frequency, getTranslation) : '',
  },
  {
    key: COLUMN_KEYS.DATE,
    title: (
      <TranslatedText
        stringId="general.date.label"
        fallback="Date"
        data-testid="translatedtext-xv2x"
      />
    ),
    sortable: false,
    accessor: ({ date }) => formatShortest(date),
  },
  {
    key: COLUMN_KEYS.QUANTITY,
    title: (
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="pharmacyOrder.table.column.quantity"
            fallback="Quantity"
            data-testid="translatedtext-3j93"
          />
        }
        required
      />
    ),
    sortable: false,
    maxWidth: 100,
    accessor: ({ quantity, onChange, hasError, selected }) => (
      <TextInput
        type="number"
        InputProps={{
          inputProps: {
            min: 1,
          },
        }}
        value={quantity}
        onChange={onChange}
        required
        error={hasError}
        disabled={!selected}
        data-testid="textinput-rxbh"
      />
    ),
  },
  {
    key: COLUMN_KEYS.REPEATS,
    title: (
      <TranslatedText
        stringId="pharmacyOrder.table.column.repeats"
        fallback="Repeats"
        data-testid="translatedtext-psdf"
      />
    ),
    sortable: false,
    accessor: ({ repeats, onChange, selected }) => (
      <Box width="89px">
        <NumberInput
          value={repeats || ''}
          onChange={onChange}
          InputProps={{
            inputProps: {
              min: 0,
            },
          }}
          disabled={!selected}
          data-testid="selectinput-ld3p"
        />
      </Box>
    ),
  },
];

const OrderingClinicianWrapper = styled.div`
  width: 25%;
  margin-bottom: 20px;
  margin-top: 20px;
`;

const StyledTable = styled(Table)`
  .MuiTableCell-root {
    &.MuiTableCell-head {
      height: 50px;
    }
    height: 65px;
    padding: 0 15px;
  }
  .MuiTableRow-root {
    &:last-child {
      .MuiTableCell-body {
        border-bottom: none;
      }
    }
  }
`;

const HorizontalDivider = styled(Divider)`
  margin: 30px 0;
`;

const CommentsWrapper = styled.div`
  margin-bottom: 20px;
  margin-top: 20px;
`;

const SuccessText = styled.div`
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 12px;
  text-align: center;
`;

const SuccessDescription = styled.div`
  font-size: 14px;
  text-align: center;
  color: ${Colors.textSecondary};
  line-height: 1.4;
`;

const SuccessContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`;

export const PharmacyOrderModal = React.memo(({ encounter, open, onClose }) => {
  const { getTranslation, getEnumTranslation } = useTranslation();

  const [orderingClinicianId, setOrderingClinicianId] = useState(null);
  const [comments, setComments] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');

  const { data, error, isLoading } = useQuery(['encounterMedication', encounter.id], () =>
    api.get(`encounter/${encounter.id}/medications`),
  );

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

  const selectAllChecked = useMemo(() => {
    return prescriptions.length > 0 && prescriptions.every(p => p.selected);
  }, [prescriptions]);

  const cellOnChange = useCallback(
    (event, key, rowIndex) => {
      if ([COLUMN_KEYS.QUANTITY, COLUMN_KEYS.REPEATS].includes(key)) {
        const newMedicationData = [...prescriptions];
        const value =
          key === COLUMN_KEYS.QUANTITY
            ? parseInt(event.target.value, 10) || undefined
            : parseInt(event.target.value, 10) || undefined;

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
      setShowSuccess(true);
    } catch (error) {
      notifyError(error.message);
    }
  }, [validateForm, encounter.id, orderingClinicianId, comments, prescriptions, api]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setShowSuccess(false);
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
        <SuccessContent>
          <PharmacyIcon src={pharmacyIcon} alt="Pharmacy" />
          <SuccessText>
            <TranslatedText
              stringId="pharmacyOrder.success.message"
              fallback="Your order has been sent to the Pharmacy"
            />
          </SuccessText>
          <SuccessDescription>
            <TranslatedText
              stringId="pharmacyOrder.success.description"
              fallback="Please do not send additional requests to the pharmacy for these item/s until the original request has been filled by the pharmacy."
            />
          </SuccessDescription>
        </SuccessContent>

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

  return (
    <StyledModal
      title={<TranslatedText stringId="pharmacyOrder.title" fallback="Pharmacy order" />}
      open={open}
      onClose={handleClose}
    >
      <TranslatedText
        stringId="pharmacyOrder.description"
        fallback="Select the prescriptions you would like to send to the pharmacy (via mSupply)"
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

      <StyledTable
        headerColor={Colors.white}
        columns={COLUMNS(getTranslation, getEnumTranslation, handleSelectAll, selectAllChecked)}
        data={tableData || []}
        elevated={false}
        isLoading={isLoading}
        errorMessage={error?.message}
        noDataMessage={
          <TranslatedText
            stringId="pharmacyOrder.table.noData"
            fallback="No medications found for this encounter"
            data-testid="translatedtext-mj0s"
          />
        }
        allowExport={false}
        cellOnChange={cellOnChange}
        data-testid="table-3r2b"
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
        cancelText={
          <TranslatedText
            stringId="general.action.cancel"
            fallback="Cancel"
            data-testid="translatedtext-9xde"
          />
        }
        confirmText={
          <TranslatedText
            stringId="pharmacyOrder.action.send"
            fallback="Send"
            data-testid="translatedtext-ojsa"
          />
        }
        confirmDisabled={!isFormValid}
        onConfirm={handleSendOrder}
        onCancel={handleClose}
        data-testid="confirmcancelrow-9lo1"
      />
    </StyledModal>
  );
});

PharmacyOrderModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
