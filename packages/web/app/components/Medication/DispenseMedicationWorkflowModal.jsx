import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { formatShort } from '@tamanu/utils/dateTime';
import {
  DRUG_ROUTE_LABELS,
  MEDICATION_DURATION_DISPLAY_UNITS_LABELS,
  STOCK_STATUS_LABELS,
  STOCK_STATUSES,
} from '@tamanu/constants';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';

import {
  BaseModal,
  ConfirmCancelBackRow,
  ConfirmCancelRow,
  TextInput,
  ThemedTooltip,
  TranslatedEnum,
  TranslatedText,
} from '@tamanu/ui-components';

import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { singularize } from '../../utils';
import { AutocompleteInput, CheckInput } from '../Field';
import { TableFormFields } from '../Table/TableFormFields';
import { DateDisplay } from '../DateDisplay';
import { getPatientNameAsString } from '../PatientNameDisplay';
import { useDispensableMedicationsQuery } from '../../api/queries/useDispensableMedicationsQuery';
import { Colors } from '../../constants';
import { BodyText } from '../Typography';
import { MedicationLabelPrintModal } from '../PatientPrinting/modals/MedicationLabelPrintModal';
import { MedicationLabel } from '../PatientPrinting/printouts/MedicationLabel';

const MODAL_STEPS = {
  DISPENSE: 'dispense',
  REVIEW: 'review',
};

const StyledModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: ${({ $step }) => ($step === MODAL_STEPS.REVIEW ? '542px' : '1322px')};
  }

  .MuiDialogActions-root {
    position: sticky;
    bottom: 0;
    background-color: ${Colors.background};
    border-top: 1px solid ${Colors.outline};
    padding: 10px 40px 20px 40px;
  }
`;

const HeaderRow = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const StyledTableFormFields = styled(TableFormFields)`
  .MuiTableCell-root {
    padding: 4px 10px;
    vertical-align: middle;
    text-align: left;
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    &.MuiTableCell-head {
      background-color: ${Colors.white};
      color: ${Colors.midText};
    }
  }
`;

const PrintContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
`;

const StyledConfirmCancelBackRow = styled(ConfirmCancelBackRow)`
  width: 100%;
  position: relative;
  button {
    white-space: nowrap;
  }
`;

const buildInstructionText = (prescription, getTranslation, getEnumTranslation) => {
  if (!prescription) return '';

  const dose = getMedicationDoseDisplay(prescription, getTranslation, getEnumTranslation);
  const frequency = prescription.frequency
    ? getTranslatedFrequency(prescription.frequency, getTranslation)
    : null;
  const route = prescription.route
    ? getEnumTranslation(DRUG_ROUTE_LABELS, prescription.route)
    : null;

  const duration =
    prescription.durationValue && prescription.durationUnit
      ? (() => {
          const unitLabel = getEnumTranslation(
            MEDICATION_DURATION_DISPLAY_UNITS_LABELS,
            prescription.durationUnit,
          );
          const value = prescription.durationValue;
          return `${value} ${singularize(unitLabel, value).toLowerCase()}`;
        })()
      : null;

  const base = [];
  if (dose) base.push(dose);
  if (frequency) base.push(frequency);
  let out = base.join(' ').trim();

  if (route) out += `${out ? ',' : ''} ${route}`;
  if (duration) out += `${out ? ' for ' : ''}${duration}`;
  if (prescription.indication) out += `${out ? ', ' : ''}for ${prescription.indication}`;

  out = out.trim();
  if (prescription.notes) {
    const notes = String(prescription.notes).trim();
    out = `${out}${out ? '. ' : ''}${notes}`;
  }

  out = out.trim();
  if (out && !out.endsWith('.')) out += '.';
  return out;
};

const getStockStatus = stock => {
  const quantity = Number(stock?.quantity);
  if (!stock || isNaN(quantity)) return STOCK_STATUSES.UNKNOWN;
  return quantity > 0 ? STOCK_STATUSES.YES : STOCK_STATUSES.NO;
};

const InstructionsInput = memo(({ value: defaultValue, onChange, ...props }) => {
  const [value, setValue] = useState(defaultValue);
  const handleChange = useCallback(e => {
    setValue(e.target.value);
    onChange(e);
  }, [onChange]);

  return (
    <TextInput
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
});

const QuantityInput = memo(({ value: defaultValue, onChange, ...props }) => {
  const [value, setValue] = useState(defaultValue);
  const handleChange = useCallback(e => {
    setValue(e.target.value);
    onChange(e);
  }, [onChange]);

  return (
    <TextInput
      {...props}
      type="number"
      value={value}
      onChange={handleChange}
    />
  );
});

export const DispenseMedicationWorkflowModal = memo(({ open, onClose, patient }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { facilityId, currentUser } = useAuth();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');

  const [step, setStep] = useState(MODAL_STEPS.DISPENSE);
  const [dispensedByUserId, setDispensedByUserId] = useState('');
  const [items, setItems] = useState([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [labelsForPrint, setLabelsForPrint] = useState([]);

  const patientId = patient?.id;

  const {
    data: dispensableResponse,
    isLoading: isLoadingDispensables,
    error: dispensablesError,
  } = useDispensableMedicationsQuery(patientId, { enabled: open });

  const { data: facility } = useQuery(
    ['facility', facilityId],
    () => api.get(`facility/${encodeURIComponent(facilityId)}`),
    { enabled: Boolean(open) && Boolean(facilityId) },
  );

  const selectedItems = useMemo(() => items.filter(i => i.selected), [items]);
  const stockColumnEnabled = useMemo(() => items.some(i => i.stock), [items]);

  useEffect(() => {
    if (open) {
      setStep(MODAL_STEPS.DISPENSE);
      setShowValidationErrors(false);
    }
  }, [open]);

  useEffect(() => {
    if (currentUser?.id) setDispensedByUserId(currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    if (!open) return;
    if (!dispensableResponse?.data) return;

    const nextItems = (dispensableResponse.data || []).map(d => ({
      ...d,
      selected: true,
      quantity: d.quantity ?? 1,
      instructions:
        buildInstructionText(d.prescription, getTranslation, getEnumTranslation) ||
        d.instructions ||
        '',
      hasQuantityError: false,
      hasInstructionsError: false,
    }));
    setItems(nextItems);
  }, [open, dispensableResponse]);

  const handleClose = useCallback(() => {
    setItems([]);
    setStep(MODAL_STEPS.DISPENSE);
    setShowValidationErrors(false);
    setShowPrintModal(false);
    setLabelsForPrint([]);
    onClose();
  }, [onClose]);

  const handleSelectAll = useCallback(event => {
    const checked = event.target.checked;
    setItems(prev => prev.map(i => ({ ...i, selected: checked })));
  }, []);

  const handleSelectRow = useCallback(
    rowIndex => event => {
      const checked = event.target.checked;
      setItems(prev => {
        const next = [...prev];
        next[rowIndex] = { ...next[rowIndex], selected: checked };
        return next;
      });
    },
    [],
  );

  const selectAllChecked = useMemo(() => items.length > 0 && items.every(i => i.selected), [items]);

  const handleQuantityChange = useCallback((rowIndex, event) => {
    setItems(prev => {
      const next = [...prev];
      const current = next[rowIndex];
      if (!current) return prev;

      const raw = event.target.value;
      const value = raw === '' ? '' : parseInt(raw, 10);
      next[rowIndex] = {
        ...current,
        quantity: value,
        hasQuantityError: current.selected && (!value || value <= 0),
      };
      return next;
    });
  }, []);

  const handleInstructionsChange = useCallback((rowIndex, event) => {
    setItems(prev => {
      const next = [...prev];
      const current = next[rowIndex];
      if (!current) return prev;

      const value = event.target.value;
      next[rowIndex] = {
        ...current,
        instructions: value,
        hasInstructionsError: current.selected && !String(value || '').trim(),
      };
      return next;
    });
  }, []);

  const validateDispenseStep = useCallback(() => {
    let valid = true;

    if (!dispensedByUserId) valid = false;
    if (selectedItems.length === 0) valid = false;

    setItems(prev =>
      prev.map(i => {
        if (!i.selected) {
          return { ...i, hasQuantityError: false, hasInstructionsError: false };
        }
        const hasQuantityError = !i.quantity || i.quantity <= 0;
        const hasInstructionsError = !String(i.instructions || '').trim();
        if (hasQuantityError || hasInstructionsError) valid = false;
        return { ...i, hasQuantityError, hasInstructionsError };
      }),
    );

    return valid;
  }, [dispensedByUserId, selectedItems.length]);

  const handleReview = useCallback(() => {
    if (!validateDispenseStep()) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);
    setStep(MODAL_STEPS.REVIEW);
  }, [validateDispenseStep, selectedItems.length]);

  const prescriptionIdsForLabels = useMemo(
    () => (step === MODAL_STEPS.REVIEW ? selectedItems.map(i => i.prescription?.id).filter(Boolean) : []),
    [selectedItems, step],
  );

  const { data: prescriptionDetailsById, isLoading: isLoadingDetails } = useQuery(
    ['dispensePrescriptionDetails', prescriptionIdsForLabels, facilityId],
    async () => {
      const results = await Promise.all(
        prescriptionIdsForLabels.map(async prescriptionId => {
          const prescription = await api.get(`medication/${encodeURIComponent(prescriptionId)}`, {
            facilityId,
          });
          return [prescriptionId, prescription];
        }),
      );
      return Object.fromEntries(results);
    },
    {
      enabled: step === MODAL_STEPS.REVIEW && prescriptionIdsForLabels.length > 0,
    },
  );

  const reviewLabels = useMemo(() => {
    return selectedItems.map(item => {
      const prescription = item.prescription;
      const details = prescriptionDetailsById?.[prescription?.id];
      const prescriberName = details?.prescriber?.displayName || details?.prescriber?.name || '-';

      const repeatsAfterDispense = item.lastDispensedAt
        ? Math.max(0, (item.remainingRepeats ?? 0) - 1)
        : item.remainingRepeats ?? 0;

      const requestNumber = item.displayId || '-';
      const facilityAddress = [facility?.streetAddress, facility?.cityTown]
        .filter(Boolean)
        .join(', ');

      return {
        id: item.id,
        medicationName: prescription?.medication?.name || '-',
        instructions: item.instructions || '',
        patientName: patient ? getPatientNameAsString(patient) : '-',
        dispensedAt: new Date().toISOString(),
        quantity: item.quantity,
        repeatsRemaining: repeatsAfterDispense,
        prescriberName,
        requestNumber,
        facilityName: facility?.name || '',
        facilityAddress,
        facilityContactNumber: facility?.contactNumber || '',
      };
    });
  }, [selectedItems, prescriptionDetailsById, patient, facility]);

  const handleDispenseAndPrint = useCallback(async () => {
    if (!validateDispenseStep()) {
      setStep(MODAL_STEPS.DISPENSE);
      return;
    }

    await api.post('medication/dispense', {
      dispensedByUserId,
      items: selectedItems.map(i => ({
        pharmacyOrderPrescriptionId: i.id,
        quantity: i.quantity,
        instructions: i.instructions,
      })),
    });

    await queryClient.invalidateQueries({ queryKey: ['dispensableMedications'] });
    
    // Prepare labels for printing
    setLabelsForPrint(reviewLabels);
    
    // Close dispense modal and open print modal
    setShowPrintModal(true);
    onClose();
  }, [
    api,
    dispensedByUserId,
    selectedItems,
    queryClient,
    validateDispenseStep,
    reviewLabels,
    onClose,
  ]);

  const columns = useMemo(() => {
    const base = [
      {
        key: 'select',
        width: '50px',
        title: (
          <CheckInput
            value={selectAllChecked}
            onChange={handleSelectAll}
            style={{ margin: 'auto' }}
            data-testid="dispense-select-all-checkbox"
          />
        ),
        accessor: (rowData, rowIndex) => (
          <CheckInput
            value={rowData.selected}
            onChange={handleSelectRow(rowIndex)}
            style={{ margin: 'auto' }}
            data-testid={`dispense-row-checkbox-${rowIndex}`}
          />
        ),
      },
      {
        key: 'prescriptionDate',
        width: '100px',
        title: (
          <TranslatedText
            stringId="medication.dispense.prescriptionDate"
            fallback="Prescription date"
          />
        ),
        accessor: rowData => <Box>{formatShort(rowData.prescriptionDate)}</Box>,
      },
      {
        key: 'medication',
        width: '250px',
        title: <TranslatedText stringId="medication.medication.label" fallback="Medication" />,
        accessor: rowData => rowData.prescription?.medication?.name || '-',
      },
      {
        key: 'quantity',
        width: '94px',
        title: (
          <>
            <TranslatedText stringId="pharmacyOrder.table.column.quantity" fallback="Quantity" />
            <Box component="span" color={Colors.alert}>
              {' '}
              *
            </Box>
          </>
        ),
        accessor: (rowData, rowIndex) => (
          <QuantityInput
            value={rowData.quantity}
            onChange={e => handleQuantityChange(rowIndex, e)}
            error={showValidationErrors && rowData.hasQuantityError}
            disabled={!rowData.selected}
            InputProps={{ inputProps: { min: 1 } }}
            data-testid="dispense-quantity"
            required={rowData.selected}
          />
        ),
      },
      {
        key: 'remainingRepeats',
        width: '94px',
        title: (
          <TranslatedText
            stringId="medication.dispense.remainingRepeats"
            fallback="Remaining repeats"
          />
        ),
        accessor: rowData => rowData.remainingRepeats ?? 0,
      },
      {
        key: 'instructions',
        title: (
          <>
            <TranslatedText stringId="medication.dispense.instructions" fallback="Instructions" />
            <Box component="span" color={Colors.alert}>
              {' '}
              *
            </Box>
          </>
        ),
        accessor: (rowData, rowIndex) => (
          <InstructionsInput
            value={rowData.instructions}
            onChange={e => handleInstructionsChange(rowIndex, e)}
            error={showValidationErrors && rowData.hasInstructionsError}
            required={rowData.selected}
            disabled={!rowData.selected}
            testId="dispense-instructions"
          />
        ),
      },
      {
        key: 'lastDispensedAt',
        width: '120px',
        title: (
          <TranslatedText stringId="medication.dispense.lastDispensed" fallback="Last dispensed" />
        ),
        accessor: rowData =>
          rowData.lastDispensedAt ? (
            <DateDisplay date={rowData.lastDispensedAt} />
          ) : (
            <TranslatedText
              stringId="general.fallback.notApplicable"
              fallback="N/A"
              casing="lower"
            />
          ),
      },
    ];

    if (stockColumnEnabled) {
      base.push({
        key: 'stock',
        width: '90px',
        title: (
          <TranslatedText
            stringId="medication-requests.table.column.stockStatus"
            fallback="Stock"
          />
        ),
        accessor: rowData => {
          const status = getStockStatus(rowData.stock);
          const content = <TranslatedEnum value={status} enumValues={STOCK_STATUS_LABELS} />;
          if (status === STOCK_STATUSES.YES) {
            return (
              <ThemedTooltip title={`Stock level: ${rowData.stock.quantity}`}>
                <span>{content}</span>
              </ThemedTooltip>
            );
          }
          return content;
        },
      });
    }

    return base;
  }, [
    handleSelectAll,
    handleSelectRow,
    selectAllChecked,
    stockColumnEnabled,
    handleQuantityChange,
    handleInstructionsChange,
    showValidationErrors,
  ]);

  const isDispenseDisabled = useMemo(() => {
    if (step !== MODAL_STEPS.REVIEW) return false;
    return isLoadingDetails;
  }, [step, isLoadingDetails]);

  const title =
    step === MODAL_STEPS.REVIEW ? (
      <TranslatedText
        stringId="medication.dispenseAndPrint.title"
        fallback="Dispense medication & print label"
      />
    ) : (
      <TranslatedText stringId="medication.dispense.title" fallback="Dispense medication" />
    );

  const actions =
    step === MODAL_STEPS.REVIEW ? (
      <StyledConfirmCancelBackRow
        backText={<TranslatedText stringId="general.action.back" fallback="Back" />}
        confirmText={
          <TranslatedText
            stringId="medication.dispenseAndPrint.action"
            fallback="Dispense & print"
          />
        }
        confirmDisabled={isDispenseDisabled}
        onBack={() => {
          setStep(MODAL_STEPS.DISPENSE);
          setShowValidationErrors(false);
        }}
        onCancel={handleClose}
        onConfirm={handleDispenseAndPrint}
      />
    ) : (
      <ConfirmCancelRow
        cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
        confirmText={<TranslatedText stringId="medication.action.review" fallback="Review" />}
        confirmDisabled={isLoadingDispensables || selectedItems.length === 0}
        onCancel={handleClose}
        onConfirm={handleReview}
      />
    );

  return (
    <>
      <StyledModal title={title} open={open} onClose={handleClose} actions={actions} $step={step}>
        {step === MODAL_STEPS.DISPENSE && (
          <>
            <HeaderRow>
              <BodyText>
                <TranslatedText
                  stringId="modal.medication.dispense.description"
                  fallback="Select the medications you'd like to dispense below. You'll be able to review and print labels on the next screen."
                />
              </BodyText>
              <Box width="365px">
                <AutocompleteInput
                  name="dispensedByUserId"
                  label={
                    <TranslatedText
                      stringId="medication.dispense.dispensedBy"
                      fallback="Dispensed by"
                    />
                  }
                  suggester={practitionerSuggester}
                  value={dispensedByUserId}
                  onChange={e => setDispensedByUserId(e.target.value)}
                  required
                  error={showValidationErrors && !dispensedByUserId}
                  helperText={
                    showValidationErrors && !dispensedByUserId
                      ? getTranslation('validation.required.inline', '*Required')
                      : ''
                  }
                  data-testid="dispense-dispensed-by"
                />
              </Box>
            </HeaderRow>

            {isLoadingDispensables ? (
              <Box p={4} textAlign="center">
                <TranslatedText stringId="general.table.loading" fallback="Loading..." />
              </Box>
            ) : dispensablesError ? (
              <Box p={4} textAlign="center" color={Colors.alert}>
                {dispensablesError.message}
              </Box>
            ) : (
              <StyledTableFormFields columns={columns} data={items} />
            )}
          </>
        )}

        {step === MODAL_STEPS.REVIEW && (
          <>
            <Box mb={2} fontSize="14px" color="#444">
              <TranslatedText
                stringId="medication.dispenseAndPrint.description"
                fallback="Please review the medication label/s below. Select Back to make changes, or Dispense & print to complete."
              />
            </Box>
            <PrintContainer>
              {reviewLabels.map(label => (
                <MedicationLabel key={label.id} data={label} />
              ))}
            </PrintContainer>
          </>
        )}
      </StyledModal>
      
      <MedicationLabelPrintModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        labels={labelsForPrint}
      />
    </>
  );
});

DispenseMedicationWorkflowModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  patient: PropTypes.shape({
    id: PropTypes.string,
    displayId: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
  }),
};

DispenseMedicationWorkflowModal.defaultProps = {
  patient: null,
};
