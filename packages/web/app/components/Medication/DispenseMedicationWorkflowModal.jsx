import React, { useEffect, useMemo, useState, memo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';

import {
  BaseModal,
  Button,
  OutlinedButton,
  TranslatedReferenceData,
  TranslatedText,
  useDateTime,
} from '@tamanu/ui-components';

import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { notifyError, notifySuccess } from '../../utils';
import { AutocompleteInput, CheckInput } from '../Field';
import { TableFormFields } from '../Table/TableFormFields';
import { trimToDate } from '@tamanu/utils/dateTime';
import { DateDisplay } from '../DateDisplay';
import { useDispensableMedicationsQuery } from '../../api/queries/useDispensableMedicationsQuery';
import { useFacilityQuery } from '../../api/queries/useFacilityQuery';
import { Colors } from '../../constants';
import { BodyText } from '../Typography';
import { MedicationLabelPrintPreview } from '../PatientPrinting/printouts/MedicationLabelPrintPreview';
import {
  buildInstructionText,
  getMedicationLabelData,
  getStockStatus,
  getTranslatedMedicationName,
  InstructionsInput,
  QuantityInput,
  resolvePresetLabelText,
  StyledPresetLabelAutocomplete,
  usePresetLabelsQuery,
} from '../../utils/medications';

const MODAL_STEPS = {
  DISPENSE: 'dispense',
  REVIEW: 'review',
};


const REVIEW_MODAL_MAX_WIDTH = 'min(720px, calc(100vw - 48px))';

const StyledModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: ${({ $step }) => ($step === MODAL_STEPS.REVIEW ? REVIEW_MODAL_MAX_WIDTH : '1322px')};
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

const DispenseHeaderToolbarRow = styled(Box)`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

const DispenseHeaderPatientSlot = styled(Box)`
  flex: 0 1 auto;
  min-width: 0;
  max-width: 260px;
  margin-left: auto;
`;

const DispensedByField = styled(Box)`
  width: 365px;
  max-width: 100%;
  flex-shrink: 0;
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

const FooterButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;

  > button {
    flex: 0 0 auto;
    white-space: nowrap;
  }
`;

const ReviewFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  row-gap: 12px;
  width: 100%;

  > button {
    flex: 0 0 auto;
    white-space: nowrap;
  }
`;

const ReviewFooterTrailing = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;

  > button {
    flex: 0 0 auto;
    white-space: nowrap;
  }
`;

const PatientSummaryPanel = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  padding: 16px;
  max-width: 260px;
`;

const PatientSummaryNameLine = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${Colors.darkText};
  line-height: 1.3;
  word-break: break-word;
`;

const PatientSummaryViewPatientLink = styled.button`
  margin-top: 4px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: ${Colors.midText};
  text-align: left;

  &:hover {
    color: ${Colors.primary};
    text-decoration: underline;
  }
`;


export const DispenseMedicationWorkflowModal = memo(
  ({ open, onClose, patient, onDispenseSuccess }) => {
    const api = useApi();
    const queryClient = useQueryClient();
    const { facilityId, currentUser } = useAuth();
    const { getTranslation, getEnumTranslation, getReferenceDataTranslation } = useTranslation();
    const practitionerSuggester = useSuggester('practitioner');
    const { presetLabelSuggester, presetLabelsList, hasPresetLabels } = usePresetLabelsQuery({
      enabled: open,
      facilityId,
    });
    const { navigateToPatient } = usePatientNavigation();
    const { formatShort, getCurrentDateTime } = useDateTime();
    const [step, setStep] = useState(MODAL_STEPS.DISPENSE);
    const [dispensedByUserId, setDispensedByUserId] = useState('');
    const [items, setItems] = useState([]);
    const [itemErrors, setItemErrors] = useState({});
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [labelsForPrint, setLabelsForPrint] = useState([]);
    const [isDispensing, setIsDispensing] = useState(false);

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
        return;
      }
      // Defer reset until after close so we don't flash the dispense step while still open
      setItems([]);
      setItemErrors({});
      setStep(MODAL_STEPS.DISPENSE);
      setShowValidationErrors(false);
      setLabelsForPrint([]);
      setIsDispensing(false);
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
            selected: true,
            quantity: quantity ?? 1,
            instructions:
              buildInstructionText(prescription, getTranslation, getEnumTranslation) ||
              instructions ||
              '',
            medicationPresetLabelId: null,
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
      onClose();
    };

    const handleSelectAll = ({ target: { checked } }) => {
      setItems(prev => prev.map(i => ({ ...i, selected: checked })));
    };

    const handleSelectRow =
      rowIndex =>
      ({ target: { checked } }) => {
        setItems(prev => {
          const next = [...prev];
          next[rowIndex] = { ...next[rowIndex], selected: checked };
          return next;
        });
      };

    const selectAllChecked = items.length > 0 && items.every(({ selected }) => selected);

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

    const handlePresetLabelChange = (rowIndex, { target: { value: presetId } }) => {
      setItems(prev => {
        const next = [...prev];
        const current = next[rowIndex];
        if (!current) return prev;

        const fallback = buildInstructionText(
          current.prescription,
          getTranslation,
          getEnumTranslation,
        );
        const nextLabelText = resolvePresetLabelText(presetId, presetLabelsList, fallback);

        next[rowIndex] = {
          ...current,
          medicationPresetLabelId: presetId || null,
          instructions: nextLabelText,
        };

        setItemErrors(prevErrors => ({
          ...prevErrors,
          [current.id]: {
            ...prevErrors[current.id],
            hasInstructionsError: current.selected && !String(nextLabelText || '').trim(),
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
      const labelItems = selectedItems.map(item => {
        const medication = item.prescription?.medication;
        return {
          id: item.id,
          medicationName: getTranslatedMedicationName(medication, getReferenceDataTranslation),
          instructions: item.instructions,
          quantity: item.quantity,
          units: item.prescription?.units,
          remainingRepeats: item.remainingRepeats,
          prescriberName: item.prescription?.prescriber?.displayName,
          requestNumber: item.displayId,
        };
      });
      const reviewLabels = getMedicationLabelData({
        items: labelItems,
        patient,
        facility,
        currentDateTime: getCurrentDateTime(),
      });
      setLabelsForPrint(reviewLabels);
    };

    const performDispense = async () => {
      const { isValid, newErrors } = validateDispenseStep(items, selectedItems, dispensedByUserId);
      setItemErrors(newErrors);
      if (!isValid) {
        setShowValidationErrors(true);
        if (step === MODAL_STEPS.REVIEW) {
          setStep(MODAL_STEPS.DISPENSE);
        }
        return false;
      }

      setIsDispensing(true);
      try {
        await api.post('medication/dispense', {
          dispensedByUserId,
          facilityId,
          items: selectedItems.map(
            ({ id, quantity, instructions, medicationPresetLabelId }) => ({
              pharmacyOrderPrescriptionId: id,
              quantity,
              instructions,
              medicationPresetLabelId: medicationPresetLabelId || null,
            }),
          ),
        });

        await queryClient.invalidateQueries({ queryKey: ['dispensableMedications'] });

        if (onDispenseSuccess) onDispenseSuccess();

        return true;
      } catch (err) {
        notifyError(err?.message);
        return false;
      } finally {
        setIsDispensing(false);
      }
    };

    const handleDispenseAndPrint = async () => {
      const ok = await performDispense();
      if (!ok) return;

      print();

      onClose();
    };

    const handleDispenseWithoutLabels = async () => {
      const ok = await performDispense();
      if (!ok) return;

      notifySuccess(
        <TranslatedText
          stringId="medication.dispense.success"
          fallback="Medication successfully dispensed"
        />,
      );

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
          accessor: ({ prescription }) => <Box>{formatShort(trimToDate(prescription?.date))}</Box>,
        },
        {
          key: 'medication',
          width: '200px',
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
          width: '84px',
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
            return (
              <QuantityInput
                value={quantity}
                onChange={e => handleQuantityChange(rowIndex, e)}
                error={showValidationErrors && hasQuantityError}
                disabled={!selected}
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
          width: '80px',
          title: (
            <TranslatedText
              stringId="medication.dispense.remainingRepeats"
              fallback="Remaining repeats"
            />
          ),
          accessor: ({ remainingRepeats }) => remainingRepeats ?? 0,
        },
        {
          key: 'instructionsReadOnly',
          title: (
            <TranslatedText stringId="medication.dispense.instructions" fallback="Instructions" />
          ),
          accessor: item => (
            <InstructionsInput
              value={buildInstructionText(item.prescription, getTranslation, getEnumTranslation)}
              disabled
              testId="dispense-instructions-readonly"
            />
          ),
        },
        ...(hasPresetLabels
          ? [
              {
                key: 'presetLabel',
                width: '150px',
                title: (
                  <TranslatedText
                    stringId="medication.dispense.presetLabel"
                    fallback="Preset labels"
                  />
                ),
                accessor: (item, rowIndex) => (
                  <StyledPresetLabelAutocomplete
                    name={`presetLabel-${item.id}`}
                    value={item.medicationPresetLabelId ?? ''}
                    suggester={presetLabelSuggester}
                    onChange={e => handlePresetLabelChange(rowIndex, e)}
                    data-testid={`dispense-preset-label-${rowIndex}`}
                  />
                ),
              },
            ]
          : []),
        {
          key: 'labelText',
          title: (
            <>
              <TranslatedText stringId="medication.dispense.labelText" fallback="Label text" />
              <Box component="span" color={Colors.alert}>
                {' '}
                *
              </Box>
            </>
          ),
          accessor: (item, rowIndex) => {
            const { id, instructions, selected } = item;
            const hasInstructionsError = itemErrors[id]?.hasInstructionsError || false;
            return (
              <InstructionsInput
                value={instructions}
                onChange={e => handleInstructionsChange(rowIndex, e)}
                error={showValidationErrors && hasInstructionsError}
                required={selected}
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
        {
          key: 'lastDispensedAt',
          width: '100px',
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
          width: '76px',
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

    const patientSummaryBanner = useMemo(() => {
      if (!patient) return null;
      const name = [patient.firstName, patient.lastName].filter(Boolean).join(' ').trim();
      const patientIdentifier = patient.displayId ?? patient.id;
      if (!name && !patientIdentifier) return null;
      const handleViewPatient = () => {
        if (!patient.id) return;
        navigateToPatient(patient.id);
      };
      return (
        <PatientSummaryPanel data-testid="dispense-modal-patient-context">
          <PatientSummaryNameLine>
            {name || (
              <TranslatedText
                stringId="general.fallback.notApplicable"
                fallback="N/A"
                casing="lower"
              />
            )}{' '}
            (
            {patientIdentifier || (
              <TranslatedText
                stringId="general.fallback.notApplicable"
                fallback="N/A"
                casing="lower"
              />
            )}
            )
          </PatientSummaryNameLine>
          {patient.id ? (
            <PatientSummaryViewPatientLink
              type="button"
              onClick={handleViewPatient}
              data-testid="dispense-modal-view-patient"
            >
              <TranslatedText stringId="medication.dispense.viewPatient" fallback="View patient" />
            </PatientSummaryViewPatientLink>
          ) : null}
        </PatientSummaryPanel>
      );
    }, [patient, navigateToPatient]);

    const dispenseWithoutLabelsButton = (
      <OutlinedButton
        onClick={handleDispenseWithoutLabels}
        disabled={
          isDispensing || isLoadingFacility || isLoadingDispensables || selectedItems.length === 0
        }
        data-testid="dispense-without-labels-button"
      >
        <TranslatedText
          stringId="medication.dispenseWithoutLabels.action"
          fallback="Dispense without labels"
        />
      </OutlinedButton>
    );

    const actions =
      step === MODAL_STEPS.REVIEW ? (
        <ReviewFooter>
          <OutlinedButton
            onClick={() => {
              setStep(MODAL_STEPS.DISPENSE);
              setShowValidationErrors(false);
            }}
            data-testid="dispense-review-back-button"
          >
            <TranslatedText stringId="general.action.back" fallback="Back" />
          </OutlinedButton>
          <ReviewFooterTrailing>
            <OutlinedButton onClick={handleClose} data-testid="dispense-review-cancel-button">
              <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
            </OutlinedButton>
            <Button
              color="primary"
              onClick={handleDispenseAndPrint}
              disabled={isDispensing || isLoadingFacility || isLoadingDispensables}
              data-testid="dispense-and-print-button"
            >
              <TranslatedText
                stringId="medication.dispenseAndPrint.action"
                fallback="Dispense & print"
              />
            </Button>
          </ReviewFooterTrailing>
        </ReviewFooter>
      ) : (
        <FooterButtonRow>
          <OutlinedButton onClick={handleClose} data-testid="dispense-cancel-button">
            <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
          </OutlinedButton>
          {dispenseWithoutLabelsButton}
          <Button
            color="primary"
            onClick={handleReview}
            disabled={isLoadingDispensables || selectedItems.length === 0}
            data-testid="dispense-review-button"
          >
            <TranslatedText
              stringId="medication.dispense.reviewAndPrintLabels"
              fallback="Review and print labels"
            />
          </Button>
        </FooterButtonRow>
      );

    return (
      <StyledModal title={title} open={open} onClose={handleClose} actions={actions} $step={step}>
        {step === MODAL_STEPS.DISPENSE && (
          <>
            <HeaderRow>
              <BodyText>
                <TranslatedText
                  stringId="modal.medication.dispense.description"
                  fallback="Select the medications you'd like to dispense below."
                />
              </BodyText>
              <DispenseHeaderToolbarRow>
                <DispensedByField>
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
                </DispensedByField>
                {patientSummaryBanner ? (
                  <DispenseHeaderPatientSlot>{patientSummaryBanner}</DispenseHeaderPatientSlot>
                ) : null}
              </DispenseHeaderToolbarRow>
            </HeaderRow>

            {isLoadingDispensables ? (
              <Box p={4} textAlign="center">
                <TranslatedText stringId="general.table.loading" fallback="Loading…" />
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

        {step === MODAL_STEPS.REVIEW && <MedicationLabelPrintPreview labels={labelsForPrint} />}
      </StyledModal>
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
