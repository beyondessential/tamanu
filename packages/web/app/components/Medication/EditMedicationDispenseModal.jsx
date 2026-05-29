import React, { useEffect, useState, memo } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import {
  BaseModal,
  ConfirmCancelBackRow,
  ConfirmCancelRow,
  TAMANU_COLORS,
  TextInput,
  TranslatedText,
  TranslatedReferenceData,
  useDateTime,
  useSettings,
} from '@tamanu/ui-components';

import { useApi, useSuggester } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { AutocompleteInput } from '../Field';
import { TableFormFields } from '../Table/TableFormFields';
import { trimToDate } from '@tamanu/utils/dateTime';
import { DateDisplay } from '../DateDisplay';
import { useFacilityQuery } from '../../api/queries/useFacilityQuery';
import { Colors } from '../../constants';
import { BodyText } from '../Typography';
import { MedicationLabelPrintPreview } from '../PatientPrinting/printouts/MedicationLabelPrintPreview';
import {
  buildInstructionText,
  getMedicationLabelData,
  getStockStatus,
  getTranslatedMedicationName,
  PRESET_LABEL_SUGGESTER_OPTIONS,
} from '../../utils/medications';

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

const StyledConfirmCancelBackRow = styled(ConfirmCancelBackRow)`
  width: 100%;
  position: relative;
  button {
    white-space: nowrap;
  }
`;

// Outer `.MuiInputBase-multiline` adds its own padding-block, so both layers
// must be zeroed/tamed or a single line sits in ~50px of whitespace.
const StyledInstructionsTextInput = styled(TextInput)`
  .MuiInputBase-root.Mui-disabled {
    background: ${TAMANU_COLORS.background};
  }
  .MuiInputBase-multiline {
    padding-block: 0;
  }
  .MuiInputBase-input {
    font-size: 14px;
    padding-block: 10px;
  }
`;

// Must stay fully controlled — preset selection programmatically replaces the
// value, so any internal copy would desync.
const InstructionsInput = memo(({ value, onChange, ...props }) => (
  <StyledInstructionsTextInput
    multiline
    minRows={1}
    maxRows={5}
    {...props}
    value={value ?? ''}
    onChange={onChange}
  />
));

const StyledQuantityTextInput = styled(TextInput)`
  .MuiInputBase-input {
    font-size: 14px;
    padding-block: 10px;
    padding-inline: 8px;
  }
`;

const QuantityInput = memo(({ value: defaultValue, onChange, ...props }) => {
  const [value, setValue] = useState(defaultValue);
  const handleChange = e => {
    setValue(e.target.value);
    onChange(e);
  };

  return (
    <StyledQuantityTextInput {...props} type="number" value={value} onChange={handleChange} />
  );
});

export const EditMedicationDispenseModal = memo(
  ({ open, medicationDispense, onClose, onConfirm, patient }) => {
    const api = useApi();
    const { facilityId } = useAuth();
    const { getSetting } = useSettings();
    const { getTranslation, getEnumTranslation, getReferenceDataTranslation } = useTranslation();
    const practitionerSuggester = useSuggester('practitioner');
    const presetLabelSuggester = useSuggester(
      'medicationPresetLabel',
      PRESET_LABEL_SUGGESTER_OPTIONS,
    );

    const presetLabelsEnabled = Boolean(getSetting('features.medicationLabelPresets.enabled'));

    const { data: presetLabelsList } = useQuery({
      queryKey: ['medicationPresetLabels', facilityId],
      queryFn: () => presetLabelSuggester.fetchSuggestions(''),
      enabled: open && presetLabelsEnabled,
      staleTime: 5 * 60 * 1000,
    });
    const hasPresetLabels = (presetLabelsList?.length ?? 0) > 0;
    const showPresetLabelColumn = presetLabelsEnabled && hasPresetLabels;
    const showLabelTextColumn = presetLabelsEnabled;

    // Derived from the prescription, not the dispense's saved instructions, so
    // it shows the original even after the label text has been edited.
    const defaultInstructions = medicationDispense
      ? buildInstructionText(
          medicationDispense.pharmacyOrderPrescription?.prescription,
          getTranslation,
          getEnumTranslation,
        )
      : '';
    const { formatShort, getCurrentDateTime } = useDateTime();
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

    // Clearing the preset (presetId = '') reverts Label text to the default.
    // Functional setters so a quick preset-then-type doesn't lose the typing.
    const handlePresetLabelChange = ({ target: { value: presetId } }) => {
      const preset = presetId ? presetLabelsList?.find(p => p.value === presetId) : null;
      const nextLabelText = preset?.name ?? defaultInstructions ?? '';
      setItem(prev => ({
        ...prev,
        medicationPresetLabelId: presetId || null,
        instructions: nextLabelText,
      }));
      setErrors(prev => ({
        ...prev,
        hasInstructionsError: !String(nextLabelText || '').trim(),
      }));
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
      const medication = item.pharmacyOrderPrescription.prescription?.medication;
      const labelItem = {
        id: item.id,
        medicationName: getTranslatedMedicationName(medication, getReferenceDataTranslation),
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
        currentDateTime: getCurrentDateTime(),
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
        medicationPresetLabelId: item.medicationPresetLabelId || null,
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
            <Box>{formatShort(trimToDate(pharmacyOrderPrescription?.prescription?.date))}</Box>
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
        // Off-flag deployments keep the original editable Instructions field.
        presetLabelsEnabled
          ? {
              key: 'instructionsReadOnly',
              title: (
                <TranslatedText
                  stringId="medication.editDispensedMedication.instructions"
                  fallback="Instructions"
                />
              ),
              accessor: () => (
                <InstructionsInput
                  value={defaultInstructions || ''}
                  disabled
                  testId="dispense-instructions-readonly"
                />
              ),
            }
          : {
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
              accessor: itemRow => {
                const { instructions } = itemRow;
                const hasInstructionsError = errors.hasInstructionsError || false;
                return (
                  <InstructionsInput
                    value={instructions}
                    onChange={handleInstructionsChange}
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
        ...(showPresetLabelColumn
          ? [
              {
                key: 'presetLabel',
                width: '160px',
                title: (
                  <TranslatedText
                    stringId="medication.editDispensedMedication.presetLabel"
                    fallback="Preset labels"
                  />
                ),
                accessor: itemRow => (
                  <AutocompleteInput
                    name={`presetLabel-${itemRow.id}`}
                    value={itemRow.medicationPresetLabelId ?? ''}
                    suggester={presetLabelSuggester}
                    onChange={handlePresetLabelChange}
                    data-testid="dispense-preset-label"
                  />
                ),
              },
            ]
          : []),
        ...(showLabelTextColumn
          ? [
              {
                key: 'labelText',
                title: (
                  <>
                    <TranslatedText
                      stringId="medication.editDispensedMedication.labelText"
                      fallback="Label text"
                    />
                    <Box component="span" color={Colors.alert}>
                      {' '}
                      *
                    </Box>
                  </>
                ),
                accessor: itemRow => {
                  const { instructions } = itemRow;
                  const hasInstructionsError = errors.hasInstructionsError || false;
                  return (
                    <InstructionsInput
                      value={instructions}
                      onChange={handleInstructionsChange}
                      error={showValidationErrors && hasInstructionsError}
                      required
                      testId="dispense-label-text"
                      helperText={
                        showValidationErrors && hasInstructionsError
                          ? getTranslation('validation.required.inline', '*Required')
                          : ''
                      }
                    />
                  );
                },
              },
            ]
          : []),
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
          confirmText={
            <TranslatedText
              stringId="medication.dispense.reviewAndPrintLabels"
              fallback="Review and print labels"
            />
          }
          confirmDisabled={isLoadingFacility}
          onCancel={handleClose}
          onConfirm={handleReview}
        />
      );

    return (
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

        {step === MODAL_STEPS.REVIEW && labelForPrint && (
          <MedicationLabelPrintPreview labels={[labelForPrint]} />
        )}
      </StyledModal>
    );
  },
);
