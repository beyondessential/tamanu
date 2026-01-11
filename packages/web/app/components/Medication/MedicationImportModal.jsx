import React, { useEffect, useMemo, useState } from 'react';
import * as yup from 'yup';
import {
  ConfirmCancelRow,
  Modal,
  TranslatedText,
  TranslatedReferenceData,
  TranslatedEnum,
  TextInput,
  Form,
} from '@tamanu/ui-components';
import { Colors } from '../../constants';
import { Box, CircularProgress } from '@mui/material';
import styled from 'styled-components';
import { AutocompleteField, CheckInput, Field } from '../Field';
import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { formatShortest, TableFormFields } from '..';
import { usePatientOngoingPrescriptionsQuery } from '../../api/queries/usePatientOngoingPrescriptionsQuery';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { useTranslation } from '../../contexts/Translation';
import {
  DRUG_ROUTE_LABELS,
  DRUG_STOCK_STATUSES,
  MAX_REPEATS,
  FORM_TYPES,
  SUBMIT_ATTEMPTED_STATUS,
} from '@tamanu/constants';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useEncounterMedicationQuery } from '../../api/queries/useEncounterMedicationQuery';
import { createPrescriptionHash } from '../../utils/medications';
import { foreignKey } from '../../utils/validation';

const StyledModal = styled(Modal)`
  .MuiDialog-paper {
    max-width: 930px;
  }
`;

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
  border-radius: 3px;
  overflow: hidden;

  thead tr th {
    text-align: left;
    background: ${Colors.white};
    font-size: 14px;
    font-weight: 400;
    color: ${Colors.midText};
    height: 44px;
    padding: 0 10px;
  }

  tbody tr td {
    font-size: 14px;
    height: 44px;
    padding: 0 10px;
    text-align: left;
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

const createValidationSchema = selectedRowIds =>
  yup.object().shape({
    prescriberId: foreignKey(
      <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
    ),
    medications: yup.lazy(obj =>
      yup.object(
        Object.keys(obj || {}).reduce((acc, medicationId) => {
          if (selectedRowIds.has(medicationId)) {
            acc[medicationId] = yup.object().shape({
              quantity: yup
                .number()
                .typeError(
                  <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
                )
                .required(
                  <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
                )
                .min(
                  0,
                  <TranslatedText stringId="validation.rule.min" fallback="Must be 0 or greater" />,
                ),
              repeats: yup
                .number()
                .typeError(
                  <TranslatedText stringId="validation.mustBeNumber" fallback="Must be a number" />,
                )
                .integer(
                  <TranslatedText
                    stringId="validation.mustBeInteger"
                    fallback="Must be a whole number"
                  />,
                )
                .min(
                  0,
                  <TranslatedText stringId="validation.rule.min" fallback="Must be 0 or greater" />,
                )
                .max(
                  MAX_REPEATS,
                  <TranslatedText
                    stringId="validation.rule.max"
                    fallback={`Must be ${MAX_REPEATS} or less`}
                    replacements={{ max: MAX_REPEATS }}
                  />,
                )
                .nullable()
                .optional(),
            });
          } else {
            acc[medicationId] = yup.object().shape({
              quantity: yup.mixed().optional(),
              repeats: yup.mixed().optional(),
            });
          }
          return acc;
        }, {}),
      ),
    ),
  });

const getColumns = (
  getTranslation,
  getEnumTranslation,
  selectedRowIds,
  onSelectChange,
  values,
  setFieldValue,
  errors,
  status,
  onSelectAll,
  selectAllChecked,
) => [
  {
    key: 'selected',
    title: (
      <CheckInput
        value={selectAllChecked}
        onChange={onSelectAll}
        style={{ margin: '2px auto 0 auto' }}
      />
    ),
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
    width: '212px',
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
      <Box>
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
    width: '115px',
    accessor: data => {
      const selected = selectedRowIds.has(data.id);
      const fieldName = `medications.${data.id}.quantity`;
      const value = values.medications?.[data.id]?.quantity ?? '';
      const fieldError = errors?.medications?.[data.id]?.quantity;
      const hasError = status?.submitStatus === SUBMIT_ATTEMPTED_STATUS && selected && !!fieldError;
      return (
        <TextInput
          type="number"
          InputProps={{
            inputProps: {
              min: 0,
            },
          }}
          value={value}
          onChange={e => setFieldValue(fieldName, e.target.value)}
          disabled={!selected}
          error={hasError}
          helperText={hasError && fieldError}
          style={{ maxWidth: '72px' }}
        />
      );
    },
  },
  {
    key: 'repeats',
    title: <TranslatedText stringId="medication.repeats.label" fallback="Repeats" />,
    width: '100px',
    accessor: data => {
      const selected = selectedRowIds.has(data.id);
      const fieldName = `medications.${data.id}.repeats`;
      const value = values.medications?.[data.id]?.repeats ?? 0;
      const fieldError = errors?.medications?.[data.id]?.repeats;
      const hasError = status?.submitStatus === SUBMIT_ATTEMPTED_STATUS && selected && !!fieldError;
      return (
        <Box mt="3px" mb="3px">
          <TextInput
            type="number"
            InputProps={{
              inputProps: {
                min: 0,
                max: MAX_REPEATS,
              },
            }}
            value={value}
            onChange={e => setFieldValue(fieldName, e.target.value)}
            disabled={!selected}
            error={hasError}
            helperText={hasError && fieldError}
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
  const { currentUser, facilityId } = useAuth();
  const queryClient = useQueryClient();

  const { data: encounterPrescriptionsData } = useEncounterMedicationQuery(encounter.id);
  const {
    data: patientOngoingPrescriptionsData,
    isLoading,
    error,
  } = usePatientOngoingPrescriptionsQuery(encounter.patientId, facilityId);

  const medications = useMemo(() => {
    const encounterPrescriptions = encounterPrescriptionsData?.data || [];
    const patientOngoingPrescriptions = patientOngoingPrescriptionsData?.data || [];

    const encounterPrescriptionHashes = new Set(encounterPrescriptions.map(createPrescriptionHash));

    return patientOngoingPrescriptions.filter(
      p =>
        !p.discontinued &&
        !encounterPrescriptionHashes.has(createPrescriptionHash(p)) &&
        p.medication?.referenceDrug?.facilities?.[0]?.stockStatus !==
          DRUG_STOCK_STATUSES.UNAVAILABLE,
    );
  }, [encounterPrescriptionsData, patientOngoingPrescriptionsData]);

  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Initialize selection when medications change (select all on init)
  useEffect(() => {
    if (medications.length > 0) {
      setSelectedRowIds(new Set(medications.map(med => med.id)));
    }
  }, [medications]);

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

  const selectAllChecked =
    medications.length > 0 && medications.every(med => selectedRowIds.has(med.id));

  const handleSelectAll = e => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(medications.map(med => med.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const initialValues = useMemo(() => {
    const medicationsValues = {};
    medications.forEach(med => {
      medicationsValues[med.id] = {
        quantity: med.quantity ?? '',
        repeats: med.repeats ?? 0,
      };
    });
    return {
      prescriberId: currentUser?.id ?? '',
      medications: medicationsValues,
    };
  }, [medications, currentUser]);

  const validationSchema = useMemo(() => createValidationSchema(selectedRowIds), [selectedRowIds]);

  const handleImportMedications = async values => {
    try {
      const selectedMedications = medications.filter(m => selectedRowIds.has(m.id));

      // Prepare medications data with quantity and repeats
      const medicationsPayload = selectedMedications.map(row => {
        const quantity = values.medications[row.id]?.quantity ?? '';
        const repeats = values.medications[row.id]?.repeats ?? 0;

        return {
          prescriptionId: row.id,
          quantity: quantity === '' ? '' : Number(quantity),
          repeats: Number(repeats),
        };
      });

      await api.post('/medication/import-ongoing', {
        encounterId: encounter.id,
        medications: medicationsPayload,
        prescriberId: values.prescriberId,
      });
      queryClient.invalidateQueries({
        queryKey: ['patient-ongoing-prescriptions', encounter.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ['encounterMedication', encounter.id],
      });
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <StyledModal
      title={
        <TranslatedText
          stringId="medication.modal.import.title"
          fallback="Add ongoing medications"
        />
      }
      width="md"
      open={open}
      onClose={onClose}
    >
      <Form
        suppressErrorDialog
        onSubmit={handleImportMedications}
        initialValues={initialValues}
        validationSchema={validationSchema}
        formType={FORM_TYPES.CREATE_FORM}
        enableReinitialize
        render={({ submitForm, values, setFieldValue, errors, status }) => (
          <Box pt={2} display={'flex'} flexDirection={'column'} gap={2.5}>
            <DarkestText display={'inline-flex'} gap={0.5}>
              <TranslatedText
                stringId="medication.modal.import.description1"
                fallback="Selected ongoing medications will be added to this encounter."
              />
              <Box fontWeight={500} component={'span'}>
                <TranslatedText
                  stringId="medication.modal.import.description2"
                  fallback="Please check carefully for clinical relevance and safety."
                />
              </Box>
            </DarkestText>
            <PrescriberWrapper>
              <Field
                name="prescriberId"
                label={
                  <TranslatedText stringId="medication.prescriber.label" fallback="Prescriber" />
                }
                component={AutocompleteField}
                suggester={practitionerSuggester}
                required
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
                  selectedRowIds,
                  handleSelectChange,
                  values,
                  setFieldValue,
                  errors,
                  status,
                  handleSelectAll,
                  selectAllChecked,
                )}
                data={medications}
              />
            )}
            <Box height={'1px'} mx={-4} backgroundColor={Colors.outline} />
            <ConfirmCancelRow
              confirmDisabled={selectedRowIds.size === 0}
              onConfirm={submitForm}
              onCancel={onClose}
            />
          </Box>
        )}
      />
    </StyledModal>
  );
};
