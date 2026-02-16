import React, { useEffect, useState, memo } from 'react';
import PropTypes from 'prop-types';
import styled, { createGlobalStyle } from 'styled-components';
import { Box } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';

import { DRUG_ROUTE_LABELS, MEDICATION_DURATION_DISPLAY_UNITS_LABELS } from '@tamanu/constants';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';

import {
  BaseModal,
  ConfirmCancelBackRow,
  ConfirmCancelRow,
  TextInput,
  TranslatedReferenceData,
  TranslatedText,
  useDateTime,
} from '@tamanu/ui-components';

import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { singularize } from '../../utils';
import { AutocompleteInput, CheckInput } from '../Field';
import { TableFormFields } from '../Table/TableFormFields';
import { DateDisplay } from '../DateDisplay';
import { useDispensableMedicationsQuery } from '../../api/queries/useDispensableMedicationsQuery';
import { useFacilityQuery } from '../../api/queries/useFacilityQuery';
import { Colors } from '../../constants';
import { BodyText } from '../Typography';
import { MedicationLabel } from '../PatientPrinting/printouts/MedicationLabel';
import { getMedicationLabelData, getStockStatus } from '../../utils/medications';

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

const PrintDescription = styled(Box)`
  margin-bottom: 16px;
  font-size: 14px;
  color: ${Colors.midText};

  @media print {
    display: none;
  }
`;

const PrintStyles = createGlobalStyle`
  @media print {
    @page {
      margin: 3mm;
      size: auto;
    }

    html, body {
      margin: 0;
      padding: 0;
    }

    .MuiDialogTitle-root,
    .MuiDialogActions-root {
      display: none;
    }

    .MuiDialog-container,
    .MuiDialog-paper,
    .MuiPaper-root,
    .MuiDialogContent-root {
      margin: 0;
      padding: 0;
    }

    /* Target ModalContainer and ModalContent BaseModal */
    .MuiDialog-paper > div,
    .MuiDialog-paper > div > div:first-child {
      margin: 0;
      padding: 0;
    }
  }
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

  const {
    frequency: prescriptionFrequency,
    route: prescriptionRoute,
    durationValue,
    durationUnit,
    indication,
    notes,
  } = prescription;

  const dose = getMedicationDoseDisplay(
    prescription,
    getTranslation,
    getEnumTranslation,
  ).toLowerCase();
  const frequency = prescriptionFrequency
    ? getTranslatedFrequency(prescriptionFrequency, getTranslation)
    : null;
  const route = prescriptionRoute ? getEnumTranslation(DRUG_ROUTE_LABELS, prescriptionRoute) : null;

  const unitLabel = getEnumTranslation(MEDICATION_DURATION_DISPLAY_UNITS_LABELS, durationUnit);

  const duration =
    durationValue && durationUnit
      ? `${durationValue} ${singularize(unitLabel, durationValue).toLowerCase()}`
      : null;

  const base = [];
  if (dose) base.push(dose);
  if (frequency) base.push(frequency);
  let output = base.join(' ').trim();

  const forText = getTranslation('medication.dispense.for', 'for');

  if (route) output += `${output ? ',' : ''} ${route}`;
  if (duration) output += `${output ? ` ${forText} ` : ''}${duration}`;
  if (indication) output += `${output ? `, ` : ''}${indication}`;
  if (output && !output.endsWith('.')) output += '.';

  if (notes) {
    output = `${output}${output ? ' ' : ''}${String(notes).trim()}`;
  }
  return output.trim();
};

const isItemDisabled = item => {
  return item.pharmacyOrder?.isDischargePrescription && (item.remainingRepeats ?? 0) === 0;
};

const InstructionsInput = memo(({ value: defaultValue, onChange, ...props }) => {
  const [value, setValue] = useState(defaultValue);
  const handleChange = e => {
    setValue(e.target.value);
    onChange(e);
  };

  return <TextInput {...props} value={value} onChange={handleChange} />;
});

const QuantityInput = memo(({ value: defaultValue, onChange, ...props }) => {
  const [value, setValue] = useState(defaultValue);
  const handleChange = e => {
    setValue(e.target.value);
    onChange(e);
  };

  return <TextInput {...props} type="number" value={value} onChange={handleChange} />;
});

export const DispenseMedicationWorkflowModal = memo(
  ({ open, onClose, patient, onDispenseSuccess }) => {
    const api = useApi();
    const queryClient = useQueryClient();
    const { facilityId, currentUser } = useAuth();
    const { getTranslation, getEnumTranslation } = useTranslation();
    const practitionerSuggester = useSuggester('practitioner');
    const { formatShort } = useDateTime();
    const [step, setStep] = useState(MODAL_STEPS.DISPENSE);
    const [dispensedByUserId, setDispensedByUserId] = useState('');
    const [items, setItems] = useState([]);
    const [itemErrors, setItemErrors] = useState({});
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [labelsForPrint, setLabelsForPrint] = useState([]);

    const patientId = patient?.id;

    const {
      data: dispensableResponse,
      isLoading: isLoadingDispensables,
      error: dispensablesError,
    } = useDispensableMedicationsQuery(patientId, { enabled: open });

    const { data: facility, isLoading: isLoadingFacility } = useFacilityQuery(facilityId, {
      enabled: open,
    });

    const selectedItems = items.filter(({ selected }) => selected);
    const stockColumnEnabled = items.some(
      ({ prescription }) => prescription?.medication?.referenceDrug?.facilities?.[0]?.stockStatus,
    );

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
      const { data: dispensableData } = dispensableResponse || {};
      if (!dispensableData) return;

      const nextItems = dispensableData
        .map(d => {
          const { quantity, prescription, instructions } = d;
          return {
            ...d,
            selected: !isItemDisabled(d), // Don't auto-select disabled items
            quantity: quantity ?? 1,
            instructions:
              buildInstructionText(prescription, getTranslation, getEnumTranslation) ||
              instructions ||
              '',
          };
        })
        .sort((a, b) => {
          // Sort by prescription date descending (newest first)
          const dateA = a.prescription?.date ? new Date(a.prescription.date) : new Date(0);
          const dateB = b.prescription?.date ? new Date(b.prescription.date) : new Date(0);
          return dateB - dateA;
        });
      setItems(nextItems);
      setItemErrors({});
    }, [open, dispensableResponse, getTranslation, getEnumTranslation]);

    const handleClose = () => {
      setItems([]);
      setItemErrors({});
      setStep(MODAL_STEPS.DISPENSE);
      setShowValidationErrors(false);
      setLabelsForPrint([]);
      onClose();
    };

    const handleSelectAll = ({ target: { checked } }) => {
      setItems(prev => prev.map(i => ({ ...i, selected: !isItemDisabled(i) ? checked : false })));
    };

    const handleSelectRow = rowIndex => ({ target: { checked } }) => {
      setItems(prev => {
        const next = [...prev];
        next[rowIndex] = { ...next[rowIndex], selected: checked };
        return next;
      });
    };

    const selectableItems = items.filter(i => !isItemDisabled(i));
    const selectAllChecked =
      selectableItems.length > 0 && selectableItems.every(({ selected }) => selected);

    const handleQuantityChange = (rowIndex, { target: { value: rawValue } }) => {
      setItems(prev => {
        const next = [...prev];
        const current = next[rowIndex];
        if (!current) return prev;

        const value = rawValue === '' ? '' : parseInt(rawValue, 10);
        const { id, selected } = current;
        next[rowIndex] = {
          ...current,
          quantity: value,
        };

        setItemErrors(prevErrors => ({
          ...prevErrors,
          [id]: {
            ...prevErrors[id],
            hasQuantityError: selected && (!value || value <= 0),
          },
        }));

        return next;
      });
    };

    const handleInstructionsChange = (rowIndex, { target: { value } }) => {
      setItems(prev => {
        const next = [...prev];
        const current = next[rowIndex];
        if (!current) return prev;

        const { id, selected } = current;
        next[rowIndex] = {
          ...current,
          instructions: value,
        };

        setItemErrors(prevErrors => ({
          ...prevErrors,
          [id]: {
            ...prevErrors[id],
            hasInstructionsError: selected && !String(value || '').trim(),
          },
        }));

        return next;
      });
    };

    const validateDispenseStep = (currentItems, currentSelectedItems, currentDispensedByUserId) => {
      let isValid = true;

      if (!currentDispensedByUserId) isValid = false;
      if (currentSelectedItems.length === 0) isValid = false;

      const newErrors = {};
      currentItems.forEach(({ id, selected, quantity, instructions }) => {
        if (!selected) {
          newErrors[id] = { hasQuantityError: false, hasInstructionsError: false };
        } else {
          const hasQuantityError = !quantity || quantity <= 0;
          const hasInstructionsError = !String(instructions || '').trim();
          if (hasQuantityError || hasInstructionsError) isValid = false;
          newErrors[id] = { hasQuantityError, hasInstructionsError };
        }
      });

      return { isValid, newErrors };
    };

    const handleReview = () => {
      const { isValid, newErrors } = validateDispenseStep(items, selectedItems, dispensedByUserId);
      setItemErrors(newErrors);
      if (!isValid) {
        setShowValidationErrors(true);
        return;
      }
      setShowValidationErrors(false);
      setStep(MODAL_STEPS.REVIEW);
      // Prepare labels for printing
      const labelItems = selectedItems.map(item => ({
        id: item.id,
        medicationName: item.prescription?.medication?.name,
        instructions: item.instructions,
        quantity: item.quantity,
        units: item.prescription?.units,
        remainingRepeats: item.remainingRepeats,
        prescriberName: item.prescription?.prescriber?.displayName,
        requestNumber: item.displayId,
      }));
      const reviewLabels = getMedicationLabelData({ items: labelItems, patient, facility });
      setLabelsForPrint(reviewLabels);
    };

    const handleDispenseAndPrint = async () => {
      const { isValid, newErrors } = validateDispenseStep(items, selectedItems, dispensedByUserId);
      setItemErrors(newErrors);
      if (!isValid) {
        setStep(MODAL_STEPS.DISPENSE);
        setShowValidationErrors(true);
        return;
      }

      await api.post('medication/dispense', {
        dispensedByUserId,
        facilityId,
        items: selectedItems.map(({ id, quantity, instructions }) => ({
          pharmacyOrderPrescriptionId: id,
          quantity,
          instructions,
        })),
      });

      await queryClient.invalidateQueries({ queryKey: ['dispensableMedications'] });

      if (onDispenseSuccess) onDispenseSuccess();

      print();

      // Close dispense modal
      onClose();
    };

    const columns = (() => {
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
          accessor: (item, rowIndex) => {
            return (
              <CheckInput
                value={item.selected}
                onChange={handleSelectRow(rowIndex)}
                style={{ margin: 'auto' }}
                data-testid={`dispense-row-checkbox-${rowIndex}`}
                disabled={isItemDisabled(item)}
              />
            );
          },
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
          accessor: ({ prescription }) => <Box>{formatShort(prescription?.date)}</Box>,
        },
        {
          key: 'medication',
          width: '250px',
          title: <TranslatedText stringId="medication.medication.label" fallback="Medication" />,
          accessor: ({ prescription }) => (
            <TranslatedReferenceData
              fallback={prescription?.medication?.name}
              value={prescription?.medication?.id}
              category={prescription?.medication?.type}
            />
          ),
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
          accessor: (item, rowIndex) => {
            const { id, quantity, selected } = item;
            const hasQuantityError = itemErrors[id]?.hasQuantityError || false;
            const disabled = isItemDisabled(item) || !selected;
            return (
              <QuantityInput
                value={quantity}
                onChange={e => handleQuantityChange(rowIndex, e)}
                error={showValidationErrors && hasQuantityError}
                disabled={disabled}
                InputProps={{ inputProps: { min: 1 } }}
                data-testid="dispense-quantity"
                required={selected}
                helperText={
                  showValidationErrors && hasQuantityError
                    ? getTranslation('validation.required.inline', '*Required')
                    : ''
                }
              />
            );
          },
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
          accessor: ({ remainingRepeats }) => remainingRepeats ?? 0,
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
          accessor: (item, rowIndex) => {
            const { id, instructions, selected } = item;
            const hasInstructionsError = itemErrors[id]?.hasInstructionsError || false;
            const disabled = isItemDisabled(item) || !selected;
            return (
              <InstructionsInput
                value={instructions}
                onChange={e => handleInstructionsChange(rowIndex, e)}
                error={showValidationErrors && hasInstructionsError}
                required={selected}
                disabled={disabled}
                testId="dispense-instructions"
                helperText={
                  showValidationErrors && hasInstructionsError
                    ? getTranslation('validation.required.inline', '*Required')
                    : ''
                }
              />
            );
          },
        },
        {
          key: 'lastDispensedAt',
          width: '120px',
          title: (
            <TranslatedText
              stringId="medication.dispense.lastDispensed"
              fallback="Last dispensed"
            />
          ),
          accessor: ({ lastDispensedAt }) =>
            lastDispensedAt ? (
              <DateDisplay date={lastDispensedAt} />
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
          accessor: row => getStockStatus(row, false),
        });
      }

      return base;
    })();

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
          confirmDisabled={isLoadingFacility || isLoadingDispensables}
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
              <PrintStyles />
              <PrintDescription>
                <TranslatedText
                  stringId="medication.dispenseAndPrint.description"
                  fallback="Please review the medication label/s below. Select Back to make changes, or Dispense & print to complete."
                />
              </PrintDescription>
              <PrintContainer>
                {labelsForPrint.map(label => (
                  <MedicationLabel key={label.id} data={label} />
                ))}
              </PrintContainer>
            </>
          )}
        </StyledModal>
      </>
    );
  },
);

DispenseMedicationWorkflowModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDispenseSuccess: PropTypes.func,
  patient: PropTypes.shape({
    id: PropTypes.string,
    displayId: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
  }),
};

DispenseMedicationWorkflowModal.defaultProps = {
  patient: null,
  onDispenseSuccess: null,
};
