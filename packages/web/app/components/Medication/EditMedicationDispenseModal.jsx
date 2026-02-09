import React, { useEffect, useState, memo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Box } from '@material-ui/core';

import {
  BaseModal,
  ConfirmCancelBackRow,
  ConfirmCancelRow,
  TextInput,
  TranslatedText,
  TranslatedReferenceData,
  useDateTimeFormat,
} from '@tamanu/ui-components';

import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { AutocompleteInput } from '../Field';
import { TableFormFields } from '../Table/TableFormFields';
import { DateDisplay } from '../DateDisplay';
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
      width: fit-content;
      max-width: none;
      height: fit-content;
      max-height: none;
      margin: 0;
      padding: 0;
      overflow: visible;
      box-shadow: none;
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

export const EditMedicationDispenseModal = memo(
  ({ open, medicationDispense, onClose, onConfirm, patient }) => {
    const api = useApi();
    const { facilityId } = useAuth();
    const { getTranslation } = useTranslation();
    const practitionerSuggester = useSuggester('practitioner');
    const { formatShort } = useDateTimeFormat();
    const [step, setStep] = useState(MODAL_STEPS.DISPENSE);
    const [dispensedByUserId, setDispensedByUserId] = useState('');
    const [item, setItem] = useState(null);
    const [errors, setErrors] = useState({});
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [labelForPrint, setLabelForPrint] = useState(null);

    const { data: facility, isLoading: isLoadingFacility } = useFacilityQuery(facilityId, {
      enabled: open,
    });

    const stockColumnEnabled =
      medicationDispense?.pharmacyOrderPrescription?.prescription?.medication?.referenceDrug
        ?.facilities?.[0]?.stockStatus;

    useEffect(() => {
      if (medicationDispense) {
        setItem(medicationDispense);
        setDispensedByUserId(medicationDispense.dispensedByUserId);
      }
    }, [medicationDispense]);

    useEffect(() => {
      if (open) {
        setStep(MODAL_STEPS.DISPENSE);
        setShowValidationErrors(false);
      }
    }, [open]);

    const handleClose = () => {
      setItem(null);
      setErrors({});
      setShowValidationErrors(false);
      setLabelForPrint(null);
      onClose();
    };

    const handleQuantityChange = ({ target: { value: rawValue } }) => {
      const value = rawValue === '' ? '' : parseInt(rawValue, 10);
      setItem({
        ...item,
        quantity: value,
      });
      setErrors({
        ...errors,
        hasQuantityError: !value || value <= 0,
      });
    };

    const handleInstructionsChange = ({ target: { value } }) => {
      setItem({
        ...item,
        instructions: value,
      });
      setErrors({
        ...errors,
        hasInstructionsError: !String(value || '').trim(),
      });
    };

    const validateDispenseStep = currentDispensedByUserId => {
      let isValid = true;

      if (!currentDispensedByUserId) isValid = false;

      const newErrors = {};
      const hasQuantityError = !item.quantity || item.quantity <= 0;
      const hasInstructionsError = !String(item.instructions || '').trim();
      if (hasQuantityError || hasInstructionsError) {
        isValid = false;
      }
      newErrors.hasQuantityError = hasQuantityError;
      newErrors.hasInstructionsError = hasInstructionsError;

      return { isValid, newErrors };
    };

    const handleReview = () => {
      const { isValid, newErrors } = validateDispenseStep(dispensedByUserId);
      setErrors(newErrors);
      if (!isValid) {
        setShowValidationErrors(true);
        return;
      }
      setShowValidationErrors(false);
      setStep(MODAL_STEPS.REVIEW);
      // Prepare labels for printing
      const labelItem = {
        id: item.id,
        medicationName: item.pharmacyOrderPrescription.prescription?.medication?.name,
        instructions: item.instructions,
        quantity: item.quantity,
        units: item.pharmacyOrderPrescription.prescription?.units,
        remainingRepeats: item.pharmacyOrderPrescription.remainingRepeats,
        prescriberName: item.pharmacyOrderPrescription.prescription?.prescriber?.displayName,
        requestNumber: item.pharmacyOrderPrescription.displayId,
      };
      const reviewLabels = getMedicationLabelData({
        items: [labelItem],
        patient: patient || item.pharmacyOrderPrescription.pharmacyOrder.encounter.patient,
        facility,
      });
      setLabelForPrint(reviewLabels[0]);
    };

    const handleDispenseAndPrint = async () => {
      const { isValid, newErrors } = validateDispenseStep(dispensedByUserId);
      setErrors(newErrors);
      if (!isValid) {
        setStep(MODAL_STEPS.DISPENSE);
        setShowValidationErrors(true);
        return;
      }

      await api.put(`medication/dispense/${medicationDispense.id}`, {
        dispensedByUserId,
        quantity: item.quantity,
        instructions: item.instructions,
      });

      if (onConfirm) onConfirm();

      print();

      // Close dispense modal
      onClose();
    };

    const columns = (() => {
      if (!item) return [];

      const base = [
        {
          key: 'prescriptionDate',
          width: '150px',
          title: (
            <TranslatedText
              stringId="medication.editDispensedMedication.prescriptionDate"
              fallback="Prescription date"
            />
          ),
          accessor: ({ pharmacyOrderPrescription }) => (
            <Box>{formatShort(pharmacyOrderPrescription?.prescription?.date.slice(0, 10))}</Box>
          ),
        },
        {
          key: 'medication',
          width: '250px',
          title: <TranslatedText stringId="medication.medication.label" fallback="Medication" />,
          accessor: ({ pharmacyOrderPrescription }) => (
            <TranslatedReferenceData
              fallback={pharmacyOrderPrescription?.prescription?.medication?.name}
              value={pharmacyOrderPrescription?.prescription?.medication?.id}
              category={pharmacyOrderPrescription?.prescription?.medication?.type}
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
          accessor: item => {
            const { quantity } = item;
            const hasQuantityError = errors.hasQuantityError || false;
            return (
              <QuantityInput
                value={quantity}
                onChange={e => handleQuantityChange(e)}
                error={showValidationErrors && hasQuantityError}
                InputProps={{ inputProps: { min: 1 } }}
                data-testid="dispense-quantity"
                required
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
              stringId="medication.editDispensedMedication.remainingRepeats"
              fallback="Remaining repeats"
            />
          ),
          accessor: ({ pharmacyOrderPrescription }) =>
            pharmacyOrderPrescription?.remainingRepeats ?? 0,
        },
        {
          key: 'instructions',
          title: (
            <>
              <TranslatedText
                stringId="medication.editDispensedMedication.instructions"
                fallback="Instructions"
              />
              <Box component="span" color={Colors.alert}>
                {' '}
                *
              </Box>
            </>
          ),
          accessor: item => {
            const { instructions } = item;
            const hasInstructionsError = errors.hasInstructionsError || false;
            return (
              <InstructionsInput
                value={instructions}
                onChange={e => handleInstructionsChange(e)}
                error={showValidationErrors && hasInstructionsError}
                required
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
          key: 'dispensedAt',
          width: '120px',
          title: (
            <TranslatedText
              stringId="medication.editDispensedMedication.lastDispensed"
              fallback="Last dispensed"
            />
          ),
          accessor: ({ dispensedAt }) => <DateDisplay date={dispensedAt} />,
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
          accessor: ({ pharmacyOrderPrescription }) =>
            getStockStatus({ prescription: pharmacyOrderPrescription.prescription }, false),
        });
      }

      return base;
    })();

    const title =
      step === MODAL_STEPS.REVIEW ? (
        <TranslatedText
          stringId="medication.editDispensedMedicationAndPrint.title"
          fallback="Dispense medication & print label"
        />
      ) : (
        <TranslatedText
          stringId="medication.editDispensedMedication.title"
          fallback="Edit dispensed medication"
        />
      );

    const actions =
      step === MODAL_STEPS.REVIEW ? (
        <StyledConfirmCancelBackRow
          backText={<TranslatedText stringId="general.action.back" fallback="Back" />}
          confirmText={
            <TranslatedText
              stringId="medication.editDispensedMedicationAndPrint.action"
              fallback="Dispense & print"
            />
          }
          confirmDisabled={isLoadingFacility}
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
          confirmDisabled={isLoadingFacility}
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
                    stringId="modal.medication.editDispensedMedication.description"
                    fallback="Edit the dispensed medication details below"
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

              <StyledTableFormFields columns={columns} data={item ? [item] : []} />
            </>
          )}

          {step === MODAL_STEPS.REVIEW && (
            <>
              <PrintStyles />
              <PrintDescription>
                <TranslatedText
                  stringId="medication.editDispensedMedicationAndPrint.description"
                  fallback="Please review the medication label/s below. Select Back to make changes, or Dispense & print to complete."
                />
              </PrintDescription>
              <PrintContainer>
                {labelForPrint && <MedicationLabel data={labelForPrint} />}
              </PrintContainer>
            </>
          )}
        </StyledModal>
      </>
    );
  },
);
