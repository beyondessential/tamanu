import React, { useEffect, useMemo, useState } from 'react';
import {
  ConfirmCancelRow,
  Modal,
  TranslatedText,
  TranslatedReferenceData,
  TranslatedEnum,
  TextInput,
} from '@tamanu/ui-components';
import { Colors } from '../../constants';
import { Box, CircularProgress } from '@mui/material';
import styled from 'styled-components';
import { AutocompleteInput, CheckInput } from '../Field';
import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import {
  formatShortest,
  TableFormFields,
} from '..';
import { usePatientOngoingPrescriptionsQuery } from '../../api/queries/usePatientOngoingPrescriptionsQuery';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { useTranslation } from '../../contexts/Translation';
import { DRUG_ROUTE_LABELS } from '@tamanu/constants';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useEncounterMedicationQuery } from '../../api/queries/useEncounterMedicationQuery';
import { createPrescriptionHash } from '../../utils/medications';

const DarkestText = styled(Box)`
  color: ${Colors.darkestText};
  font-size: 14px;
`;

const PrescriberWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;

  .react-autosuggest__container,
  .patient-weight-input {
    width: 270px;
  }
`;

const StyledTableFormFields = styled(TableFormFields)`
  thead tr th {
    text-align: left;
    background: ${Colors.white};
    font-size: 14px;
    font-weight: 400;
    color: ${Colors.midText};
    height: 44px;
    padding: 0 15px;
  }

  tbody tr td {
    font-size: 14px;
    height: 44px;
    padding: 0 15px;
    text-align: left;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const LoadingWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
`;

const ErrorWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  color: ${Colors.alert};
`;

const isEmptyNumber = value => value === '' || value === null || value === undefined;

const getColumns = (getTranslation, getEnumTranslation, onFieldChange, showErrors, onSelectChange, selectedRowIds) => [
  {
    key: 'selected',
    title: '',
    width: '50px',
    accessor: data => (
      <CheckInput
        value={selectedRowIds.has(data.id)}
        name="selected"
        onChange={e => onSelectChange(data.id, e.target.checked)}
        style={{ margin: 'auto' }}
      />
    ),
  },
  {
    key: 'medication',
    title: (
      <TranslatedText stringId="patient.medication.table.column.medication" fallback="Medication" />
    ),
    accessor: data => (
      <TranslatedReferenceData
        fallback={data?.medication?.name}
        value={data?.medication?.id}
        category={data?.medication?.type}
      />
    ),
  },
  {
    key: 'dose',
    title: <TranslatedText stringId="patient.medication.table.column.dose" fallback="Dose" />,
    accessor: data => (
      <Box whiteSpace={'pre'}>
        {getMedicationDoseDisplay(data, getTranslation, getEnumTranslation)}
        {data.isPrn && ` ${getTranslation('patient.medication.table.prn', 'PRN')}`}
      </Box>
    ),
  },
  {
    key: 'frequency',
    title: (
      <TranslatedText stringId="patient.medication.table.column.frequency" fallback="Frequency" />
    ),
    accessor: data =>
      data.frequency ? getTranslatedFrequency(data.frequency, getTranslation) : '',
  },
  {
    key: 'route',
    title: <TranslatedText stringId="patient.medication.table.column.route" fallback="Route" />,
    accessor: data => <TranslatedEnum value={data.route} enumValues={DRUG_ROUTE_LABELS} />,
  },
  {
    key: 'quantity',
    title: (
      <Box display="flex" alignItems="center" justifyContent="center">
        <TranslatedText
          stringId="medication.dischargeQuantity.label.short"
          fallback="Discharge qty"
        />
        <Box component="span" color={Colors.alert} ml={0.5}>
          *
        </Box>
      </Box>
    ),
    width: '130px',
    accessor: data => {
      const selected = selectedRowIds.has(data.id);
      const value = !isEmptyNumber(data.quantity) ? String(data.quantity) : '';
      const hasError = Boolean(showErrors && selected && isEmptyNumber(value));
      return (
        <TextInput
          type="number"
          InputProps={{
            inputProps: {
              min: 0,
            },
          }}
          value={value}
          onChange={e => onFieldChange(data.id, 'quantity', e.target.value)}
          disabled={!selected}
          error={hasError}
          helperText={
            hasError && (
              <TranslatedText stringId="validation.required.inline" fallback="*Required" />
            )
          }
          style={{ maxWidth: "72px" }}
        />
      );
    },
  },
  {
    key: 'repeats',
    title: <TranslatedText stringId="medication.repeats.label" fallback="Repeats" />,
    width: '102px',
    accessor: data => {
      const selected = selectedRowIds.has(data.id);
      const value = data.repeats !== undefined && data.repeats !== null ? String(data.repeats) : '0';
      return (
        <Box mt="3px" mb="3px">
          <TextInput
            type="number"
            InputProps={{
              inputProps: {
                min: 0,
                max: 99,
              },
            }}
            value={value}
            onChange={e => onFieldChange(data.id, 'repeats', e.target.value)}
            disabled={!selected}
          />
        </Box>
      );
    },
  },
  {
    key: 'date',
    title: <TranslatedText stringId="patient.medication.table.column.date" fallback="Date" />,
    accessor: data => formatShortest(data.date),
  },
];

export const MedicationImportModal = ({ encounter, open, onClose, onSaved }) => {
  const api = useApi();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');
  const { currentUser } = useAuth();
  const [prescriberId, setPrescriberId] = useState(() => currentUser?.id ?? null);
  const [medicationEdits, setMedicationEdits] = useState({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const queryClient = useQueryClient();

  const { data: encounterPrescriptionsData } = useEncounterMedicationQuery(encounter.id);
  const {
    data: patientOngoingPrescriptionsData,
    isLoading,
    error,
  } = usePatientOngoingPrescriptionsQuery(encounter.patientId);

  const medications = useMemo(() => {
    const encounterPrescriptions = encounterPrescriptionsData?.data || [];
    const patientOngoingPrescriptions = patientOngoingPrescriptionsData?.data || [];

    const encounterPrescriptionHashes = new Set(encounterPrescriptions.map(createPrescriptionHash));

    return patientOngoingPrescriptions
      .filter(p => !p.discontinued)
      .filter(p => !encounterPrescriptionHashes.has(createPrescriptionHash(p)));
  }, [encounterPrescriptionsData, patientOngoingPrescriptionsData]);

  // Initialize medication edits with default values from prescriptions
  useEffect(() => {
    const initialEdits = {};
    medications.forEach(med => {
      initialEdits[med.id] = {
        quantity: med.quantity ?? '',
        repeats: med.repeats ?? 0,
      };
    });
    setMedicationEdits(initialEdits);
  }, [medications]);

  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Initialize selection when medications change (select all on init)
  useEffect(() => {
    if (medications.length > 0) {
      setSelectedRowIds(new Set(medications.map(med => med.id)));
    }
  }, [medications]);

  const medicationsWithEdits = useMemo(() => {
    return medications.map(med => ({
      ...med,
      quantity: medicationEdits[med.id]?.quantity ?? med.quantity ?? '',
      repeats: medicationEdits[med.id]?.repeats ?? med.repeats ?? 0,
    }));
  }, [medications, medicationEdits]);

  const selectedRows = useMemo(() => {
    return medicationsWithEdits.filter(med => selectedRowIds.has(med.id));
  }, [medicationsWithEdits, selectedRowIds]);

  const handleSelectChange = (medicationId, isSelected) => {
    setSelectedRowIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(medicationId);
      } else {
        newSet.delete(medicationId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    setPrescriberId(currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    if (open) setShowValidationErrors(false);
  }, [open]);

  const handleFieldChange = (medicationId, field, value) => {
    setMedicationEdits(prev => ({
      ...prev,
      [medicationId]: {
        ...prev[medicationId],
        [field]: value,
      },
    }));
  };

  const handleImportMedications = async () => {
    try {
      setShowValidationErrors(true);

      const selectedMedications = medicationsWithEdits.filter(m => selectedRowIds.has(m.id));

      const hasMissingQuantity = selectedMedications.some(m => isEmptyNumber(m.quantity));
      if (!prescriberId || hasMissingQuantity) {
        return;
      }

      // Prepare medications data with quantity and repeats
      const medicationsPayload = selectedMedications.map(row => {
        const quantity = medicationEdits[row.id]?.quantity ?? row.quantity ?? '';
        const repeats = medicationEdits[row.id]?.repeats ?? row.repeats ?? 0;

        return {
          prescriptionId: row.id,
          quantity: quantity === '' ? '' : Number(quantity),
          repeats: Number(repeats),
        };
      });

      await api.post('/medication/import-ongoing', {
        encounterId: encounter.id,
        medications: medicationsPayload,
        prescriberId,
      });
      queryClient.invalidateQueries({
        queryKey: ['patient-ongoing-prescriptions', encounter.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ['encounterMedication', encounter.id],
      });
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Modal
      title={
        <TranslatedText
          stringId="medication.modal.import.title"
          fallback="Add ongoing medications"
        />
      }
      width="xl"
      open={open}
      onClose={onClose}
    >
      <Box pt={2} display={'flex'} flexDirection={'column'} gap={2.5}>
        <DarkestText display={'inline-flex'} gap={0.5}>
          <TranslatedText
            stringId="medication.modal.import.description1"
            fallback="Selected ongoing medications will be added to this encounter."
          />
          <Box fontWeight={500} component={'span'}>
            <TranslatedText
              stringId="medication.modal.import.description2"
              fallback="Please check carefully for clinical relevance and safety"
            />
          </Box>
        </DarkestText>
        <PrescriberWrapper>
          <AutocompleteInput
            name="prescriberId"
            label={<TranslatedText stringId="medication.prescriber.label" fallback="Prescriber" />}
            suggester={practitionerSuggester}
            onChange={event => setPrescriberId(event.target.value)}
            value={prescriberId}
            required
            error={showValidationErrors && !prescriberId}
            helperText={
              showValidationErrors && !prescriberId && (
                <TranslatedText stringId="validation.required.inline" fallback="*Required" />
              )
            }
          />
        </PrescriberWrapper>
        {isLoading ? (
          <LoadingWrapper>
            <CircularProgress />
          </LoadingWrapper>
        ) : error ? (
          <ErrorWrapper>{error.message}</ErrorWrapper>
        ) : (
          <StyledTableFormFields
            columns={getColumns(
              getTranslation,
              getEnumTranslation,
              handleFieldChange,
              showValidationErrors,
              handleSelectChange,
              selectedRowIds,
            )}
            data={medicationsWithEdits}
          />
        )}
        <Box height={'1px'} mx={-4} backgroundColor={Colors.outline} />
        <ConfirmCancelRow
          confirmDisabled={!selectedRows.length}
          onConfirm={handleImportMedications}
          onCancel={onClose}
        />
      </Box>
    </Modal>
  );
};
