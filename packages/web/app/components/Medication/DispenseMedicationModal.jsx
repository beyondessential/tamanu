import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box, Checkbox, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@material-ui/core';
import { formatShortest } from '@tamanu/utils/dateTime';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { Colors } from '../../constants';
import {
  TextField,
  ConfirmCancelRow,
  BaseModal,
  TranslatedText,
} from '@tamanu/ui-components';
import { AutocompleteInput } from '../Field';
import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { TranslatedReferenceData } from '../Translation';
import { formatMedicationInstructions } from '../../utils/medications';
import { DRUG_ROUTE_LABELS, PHARMACY_PRESCRIPTION_TYPES } from '@tamanu/constants';
import { BodyText } from '../Typography';

const StyledModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 1200px;
  }
`;

const SubmitButtonsWrapper = styled.div`
  border-top: 1px solid ${Colors.outline};
  padding-top: 10px;
  margin-top: 20px;
`;

const DispensedByWrapper = styled.div`
  width: 35%;
  margin-bottom: 20px;
  margin-top: 20px;
`;

const StyledTable = styled(Table)`
  margin-top: 20px;
  .MuiTableCell-root {
    &.MuiTableCell-head {
      height: 50px;
      background-color: ${Colors.white};
      font-weight: 500;
      color: ${Colors.midText};
    }
    height: 65px;
    padding: 8px 15px;
    vertical-align: top;
  }
  .MuiTableRow-root {
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
`;

const InstructionsTextArea = styled(TextField)`
  min-width: 300px;
  .MuiInputBase-root {
    min-height: 40px;
    height: auto;
  }
  .MuiInputBase-input {
    overflow: hidden;
    resize: none;
  }
`;

const QuantityInput = styled(TextField)`
  width: 80px;
  .MuiInputBase-input {
    text-align: center;
  }
`;

// Hardcoded sample data for testing
const SAMPLE_MEDICATION_REQUESTS = [
  {
    id: '1',
    prescriptionDate: '2024-01-01',
    medication: {
      id: 'med1',
      name: 'Amiodarone HCL 200mg Tablets',
      type: 'drug',
    },
    quantity: 1,
    remainingRepeats: 0,
    instructions: '1 tab Daily at night, Oral for 1 month, For post-operative pain. Ensure taken with food in morning',
    lastDispensed: '2023-12-20',
    stock: { available: true, level: 23983 },
    prescriptionType: PHARMACY_PRESCRIPTION_TYPES.INPATIENT,
    doseAmount: 1,
    units: 'tab',
    frequency: 'DAILY',
    route: 'ORAL',
    durationValue: 1,
    durationUnit: 'month',
    indication: 'post-operative pain',
    notes: 'Ensure taken with food in morning',
  },
  {
    id: '2',
    prescriptionDate: '2024-01-01',
    medication: {
      id: 'med2',
      name: 'Calcipotriol + Betamethasone 50mcg/500mcg Ointment 30g',
      type: 'drug',
    },
    quantity: 16,
    remainingRepeats: 3,
    instructions: '1 tab Daily at night, Oral for 1 month, For post-operative pain.',
    lastDispensed: '2023-12-20',
    stock: { available: true, level: 500 },
    prescriptionType: PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT,
    doseAmount: 1,
    units: 'tab',
    frequency: 'DAILY',
    route: 'ORAL',
    durationValue: 1,
    durationUnit: 'month',
    indication: 'post-operative pain',
    notes: '',
  },
  {
    id: '3',
    prescriptionDate: '2024-01-01',
    medication: {
      id: 'med3',
      name: 'Amiodarone HCL 200mg Tablets',
      type: 'drug',
    },
    quantity: 5,
    remainingRepeats: 5,
    instructions: '1 tab Four times daily, Oral for 1 month. Take with food',
    lastDispensed: null,
    stock: { available: false },
    prescriptionType: PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT,
    doseAmount: 1,
    units: 'tab',
    frequency: 'FOUR_TIMES_DAILY',
    route: 'ORAL',
    durationValue: 1,
    durationUnit: 'month',
    indication: '',
    notes: 'Take with food',
  },
];

export const DispenseMedicationModal = React.memo(({ open, onClose, patient, onReview }) => {
  const [dispensedById, setDispensedById] = useState('');
  const [medicationRequests, setMedicationRequests] = useState([]);
  const practitionerSuggester = useSuggester('practitioner');
  const { currentUser } = useAuth();
  const { getTranslation, getEnumTranslation } = useTranslation();

  // Initialize with hardcoded sample data
  useEffect(() => {
    if (open) {
      // Sort by prescription date
      const sorted = [...SAMPLE_MEDICATION_REQUESTS].sort(
        (a, b) => new Date(a.prescriptionDate) - new Date(b.prescriptionDate),
      );
      // All selected by default
      const withSelection = sorted.map(req => ({
        ...req,
        selected: true,
        editedQuantity: req.quantity,
        editedInstructions: req.instructions,
      }));
      setMedicationRequests(withSelection);
      setDispensedById(currentUser?.id || '');
    }
  }, [open, currentUser]);

  const handleSelectAll = useCallback(event => {
    const checked = event.target.checked;
    setMedicationRequests(prev =>
      prev.map(req => ({
        ...req,
        selected: checked,
      })),
    );
  }, []);

  const handleSelectRow = useCallback(
    rowIndex => event => {
      const checked = event.target.checked;
      setMedicationRequests(prev => {
        const newRequests = [...prev];
        newRequests[rowIndex] = {
          ...newRequests[rowIndex],
          selected: checked,
        };
        return newRequests;
      });
    },
    [],
  );

  const handleQuantityChange = useCallback(
    (rowIndex, value) => {
      setMedicationRequests(prev => {
        const newRequests = [...prev];
        newRequests[rowIndex] = {
          ...newRequests[rowIndex],
          editedQuantity: value ? parseInt(value, 10) : '',
        };
        return newRequests;
      });
    },
    [],
  );

  const handleInstructionsChange = useCallback(
    (rowIndex, value) => {
      setMedicationRequests(prev => {
        const newRequests = [...prev];
        newRequests[rowIndex] = {
          ...newRequests[rowIndex],
          editedInstructions: value,
        };
        return newRequests;
      });
    },
    [],
  );

  const selectAllChecked = useMemo(() => {
    return medicationRequests.length > 0 && medicationRequests.every(req => req.selected);
  }, [medicationRequests]);

  const validateForm = useCallback(() => {
    const selectedRequests = medicationRequests.filter(req => req.selected);
    const hasValidQuantities = selectedRequests.every(
      req => req.editedQuantity && req.editedQuantity > 0,
    );
    const hasValidInstructions = selectedRequests.every(
      req => req.editedInstructions && req.editedInstructions.trim() !== '',
    );
    const hasDispensedBy = dispensedById;
    const hasSelectedRequests = selectedRequests.length > 0;

    return hasValidQuantities && hasValidInstructions && hasDispensedBy && hasSelectedRequests;
  }, [medicationRequests, dispensedById]);

  const handleReview = useCallback(() => {
    if (!validateForm()) return;

    const selectedRequests = medicationRequests
      .filter(req => req.selected)
      .map(req => ({
        ...req,
        quantity: req.editedQuantity,
        instructions: req.editedInstructions,
      }));

    onReview(selectedRequests, dispensedById);
  }, [medicationRequests, dispensedById, validateForm, onReview]);

  const isFormValid = validateForm();

  // Check if stock column should be shown (would check facility setting in real implementation)
  const showStockColumn = true;

  return (
    <StyledModal
      title={
        <TranslatedText
          stringId="medication.dispense.title"
          fallback="Dispense medication"
        />
      }
      open={open}
      onClose={onClose}
    >
      <BodyText color={Colors.darkText} fontWeight={500}>
        <TranslatedText
          stringId="medication.dispense.description"
          fallback="Select the medications you'd like to dispense below. You'll be able to review and print labels on the next screen."
        />
      </BodyText>

      <DispensedByWrapper>
        <AutocompleteInput
          name="dispensedById"
          label={
            <TranslatedText
              stringId="medication.dispense.dispensedBy.label"
              fallback="Dispensed by *"
            />
          }
          suggester={practitionerSuggester}
          onChange={event => setDispensedById(event.target.value)}
          value={dispensedById}
          required
        />
      </DispensedByWrapper>

      <BodyText color={Colors.darkText} fontWeight={500} style={{ marginTop: '20px' }}>
        <TranslatedText
          stringId="medication.dispense.selectMedications"
          fallback="Select the medications you would like to dispense below."
        />
      </BodyText>

      <StyledTable>
        <TableHead>
          <TableRow>
            <TableCell>
              <Checkbox
                checked={selectAllChecked}
                onChange={handleSelectAll}
                color="primary"
              />
            </TableCell>
            <TableCell>
              <TranslatedText
                stringId="medication.dispense.table.prescriptionDate"
                fallback="Prescription date"
              />
            </TableCell>
            <TableCell>
              <TranslatedText
                stringId="medication.medication.label"
                fallback="Medication"
              />
            </TableCell>
            <TableCell>
              <TranslatedText
                stringId="medication.dispense.table.quantity"
                fallback="Quantity *"
              />
            </TableCell>
            <TableCell>
              <TranslatedText
                stringId="medication.dispense.table.remainingRepeats"
                fallback="Remaining repeats"
              />
            </TableCell>
            <TableCell>
              <TranslatedText
                stringId="medication.dispense.table.instructions"
                fallback="Instructions *"
              />
            </TableCell>
            <TableCell>
              <TranslatedText
                stringId="medication.dispense.table.lastDispensed"
                fallback="Last dispensed"
              />
            </TableCell>
            {showStockColumn && (
              <TableCell>
                <TranslatedText
                  stringId="medication.dispense.table.stock"
                  fallback="Stock"
                />
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {medicationRequests.map((request, index) => (
            <TableRow key={request.id}>
              <TableCell>
                <Checkbox
                  checked={request.selected}
                  onChange={handleSelectRow(index)}
                  color="primary"
                />
              </TableCell>
              <TableCell>{formatShortest(request.prescriptionDate)}</TableCell>
              <TableCell>
                <TranslatedReferenceData
                  fallback={request.medication.name}
                  value={request.medication.id}
                  category={request.medication.type}
                />
              </TableCell>
              <TableCell>
                <QuantityInput
                  type="number"
                  value={request.editedQuantity}
                  onChange={e => handleQuantityChange(index, e.target.value)}
                  disabled={!request.selected}
                  required
                  InputProps={{
                    inputProps: {
                      min: 1,
                    },
                  }}
                />
              </TableCell>
              <TableCell>
                {request.prescriptionType === PHARMACY_PRESCRIPTION_TYPES.INPATIENT
                  ? 0
                  : request.remainingRepeats}
              </TableCell>
              <TableCell>
                <InstructionsTextArea
                  multiline
                  value={request.editedInstructions}
                  onChange={e => handleInstructionsChange(index, e.target.value)}
                  disabled={!request.selected}
                  required
                  style={{
                    minHeight: '40px',
                    height: 'auto',
                  }}
                />
              </TableCell>
              <TableCell>
                {request.lastDispensed ? formatShortest(request.lastDispensed) : 'n/a'}
              </TableCell>
              {showStockColumn && (
                <TableCell>
                  {request.stock.available === true ? (
                    <Tooltip title={`Stock level: ${request.stock.level?.toLocaleString()} units`}>
                      <span>Yes</span>
                    </Tooltip>
                  ) : request.stock.available === false ? (
                    'No'
                  ) : (
                    'Unknown'
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>

      <SubmitButtonsWrapper>
        <ConfirmCancelRow
          confirmText={
            <TranslatedText
              stringId="medication.dispense.action.review"
              fallback="Review"
            />
          }
          confirmDisabled={!isFormValid}
          onConfirm={handleReview}
          onCancel={onClose}
        />
      </SubmitButtonsWrapper>
    </StyledModal>
  );
});

DispenseMedicationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  patient: PropTypes.object,
  onReview: PropTypes.func.isRequired,
};
