import React, { useEffect, useMemo, useState } from 'react';
import {
  ConfirmCancelRow,
  Modal,
  TranslatedText,
  TranslatedReferenceData,
  TranslatedEnum,
  DateDisplay,
} from '@tamanu/ui-components';
import { Colors } from '../../constants';
import { Box } from '@mui/material';
import styled from 'styled-components';
import { AutocompleteInput } from '../Field';
import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import {
  Table,
  useSelectableColumn,
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

const StyledTable = styled(Table)`
  padding: 0 10px;
  .MuiTableCell-root {
    &.MuiTableCell-head {
      height: 44px;
      color: ${Colors.midText};
      font-weight: 400;
      .MuiButtonBase-root {
        color: ${Colors.midText};
      }
    }
    &.MuiTableCell-body {
      height: 44px;
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

const COLUMNS = (getTranslation, getEnumTranslation) => [
  {
    key: 'medication',
    title: (
      <TranslatedText stringId="patient.medication.table.column.medication" fallback="Medication" />
    ),
    sortable: false,
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
    sortable: false,
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
    sortable: false,
    accessor: data =>
      data.frequency ? getTranslatedFrequency(data.frequency, getTranslation) : '',
  },
  {
    key: 'route',
    title: <TranslatedText stringId="patient.medication.table.column.route" fallback="Route" />,
    sortable: false,
    accessor: data => <TranslatedEnum value={data.route} enumValues={DRUG_ROUTE_LABELS} />,
  },
  {
    key: 'date',
    title: <TranslatedText stringId="patient.medication.table.column.date" fallback="Date" />,
    sortable: false,
    accessor: data => <DateDisplay date={data.date} shortYear />,
  },
  {
    key: 'prescriber',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.initialPrescriber"
        fallback="Initial prescriber"
      />
    ),
    sortable: false,
    accessor: data => data?.prescriber?.displayName ?? '',
  },
];

export const MedicationImportModal = ({ encounter, open, onClose, onSaved }) => {
  const api = useApi();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');
  const { currentUser } = useAuth();
  const [prescriberId, setPrescriberId] = useState(null);
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

  const { selectedRows, selectableColumn } = useSelectableColumn(medications, {
    columnKey: 'selected',
    selectAllOnInit: true,
  });

  useEffect(() => {
    setPrescriberId(currentUser.id);
  }, [currentUser]);

  const handleImportMedications = async () => {
    try {
      await api.post('/medication/import-ongoing', {
        encounterId: encounter.id,
        prescriptionIds: selectedRows.map(row => row.id),
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
      width="md"
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
            value={currentUser.id}
            required
            error={!prescriberId}
            helperText={
              !prescriberId && (
                <TranslatedText stringId="validation.required.inline" fallback="*Required" />
              )
            }
          />
        </PrescriberWrapper>
        <StyledTable
          headerColor={Colors.white}
          columns={[selectableColumn, ...COLUMNS(getTranslation, getEnumTranslation)]}
          data={medications}
          elevated={false}
          isLoading={isLoading}
          errorMessage={error?.message}
          noDataMessage={
            <TranslatedText
              stringId="medication.modal.printMultiple.table.noData"
              fallback="No medication requests found"
              data-testid="translatedtext-mj0s"
            />
          }
          allowExport={false}
          data-testid="table-3r2b"
        />
        <Box height={'1px'} mx={-4} backgroundColor={Colors.outline} />
        <ConfirmCancelRow
          confirmDisabled={!selectedRows.length || !prescriberId}
          onConfirm={handleImportMedications}
          onCancel={onClose}
        />
      </Box>
    </Modal>
  );
};
