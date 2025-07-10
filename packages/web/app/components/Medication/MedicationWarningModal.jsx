import React from 'react';
import { BaseModal } from '../BaseModal';
import { TranslatedText } from '../Translation/TranslatedText';
import { Box } from '@mui/material';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { Button, formatShortest, Table, TranslatedEnum, TranslatedReferenceData } from '..';
import { getDose, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { DRUG_ROUTE_LABELS } from '@tamanu/constants';
import { useTranslation } from '../../contexts/Translation';
import { MedicationSummary } from './MedicationSummary';

const StyledModal = styled(BaseModal)`
  .MuiDialogActions-root {
    border-top: 1px solid ${Colors.outline};
  }
`;

const Description = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
`;

const TableTitle = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  color: ${Colors.darkText};
  margin-bottom: 4px;
`;

const StyledTable = styled(Table)`
  box-shadow: none;
  padding: 0 10px;
  .MuiTableCell-root.MuiTableCell-head {
    background-color: ${Colors.white};
    padding: 12px 10px;
    font-weight: 400;
    color: ${Colors.midText};
  }
  .MuiTableCell-root.MuiTableCell-body {
    padding: 12px 10px;
    border-bottom: none;
  }
`;

const StyledMedicationSummary = styled(MedicationSummary)`
  width: calc(50% - 8px);
  margin: 0 !important;
`;

const COLUMNS = (getTranslation, getEnumTranslation) => [
  {
    key: 'medication.name',
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
    accessor: data => (
      <>
        {getDose(data, getTranslation, getEnumTranslation)}
        {data.isPrn && ` ${getTranslation('patient.medication.table.prn', 'PRN')}`}
      </>
    ),
    sortable: false,
  },
  {
    key: 'frequency',
    title: (
      <TranslatedText stringId="patient.medication.table.column.frequency" fallback="Frequency" />
    ),
    accessor: data =>
      data.frequency ? getTranslatedFrequency(data.frequency, getTranslation) : '',
    sortable: false,
  },
  {
    key: 'route',
    title: <TranslatedText stringId="patient.medication.table.column.route" fallback="Route" />,
    accessor: data => <TranslatedEnum value={data.route} enumValues={DRUG_ROUTE_LABELS} />,
    sortable: false,
  },
  {
    key: 'date',
    title: <TranslatedText stringId="patient.medication.table.column.date" fallback="Date" />,
    accessor: data => `${formatShortest(data.date)}`,
    sortable: false,
  },
  {
    key: 'prescriber',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.initialPrescriber"
        fallback="Initial prescriber"
      />
    ),
    accessor: data => data?.prescriber?.displayName ?? '',
    sortable: false,
  },
];

export const MedicationWarningModal = ({
  existingOngoingPrescriptions,
  onCancelCreating,
  onContinueCreating,
  onClose,
  onBack,
  isCreatingMedicationSet,
  selectedMedications,
}) => {
  const { getTranslation, getEnumTranslation } = useTranslation();
  const warningMedications = selectedMedications?.filter(p1 =>
    existingOngoingPrescriptions.some(p2 => p2.medication.id === p1.medication.id),
  );

  return (
    <StyledModal
      title={
        <Box pl={1}>
          <TranslatedText
            stringId="medication.warningModal.title"
            fallback="Existing ongoing medication"
          />
        </Box>
      }
      open
      onClose={onClose}
      width="md"
      actions={
        <Box
          px={4}
          py={1.5}
          width="100%"
          display={'flex'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          {onBack ? (
            <Button variant="outlined" onClick={onBack}>
              <TranslatedText stringId="general.action.back" fallback="Back" />
            </Button>
          ) : (
            <div />
          )}
          <Box display={'flex'} gap={2}>
            <Button variant="outlined" onClick={onCancelCreating}>
              <TranslatedText
                stringId="medication.warningModal.cancel"
                fallback="Cancel creating new prescription"
              />
            </Button>
            <Button variant="contained" color="primary" onClick={onContinueCreating}>
              <TranslatedText
                stringId="medication.warningModal.continue"
                fallback="Continue creating new prescription"
              />
            </Button>
          </Box>
        </Box>
      }
    >
      <Box px={1} py={2}>
        <Description>
          {isCreatingMedicationSet ? (
            <TranslatedText
              stringId="medication.warningModal.medicationSet.description1"
              fallback="Some medications in this medication set are active ongoing medications. By prescribing this medication set, the existing ongoing medications will be discontinued."
            />
          ) : (
            <TranslatedText
              stringId="medication.warningModal.singleMedication.description1"
              fallback="The medication selected is an active ongoing medication. By prescribing this medication, the existing ongoing medication will be discontinued."
            />
          )}
        </Description>
        <Description mt={2}>
          {isCreatingMedicationSet ? (
            <TranslatedText
              stringId="medication.warningModal.medicationSet.description2"
              fallback="Would you like to continue prescribing this medication set which will cause the existing ongoing medication to be discontinued on finalisation or would you like to cancel creating the prescription?"
            />
          ) : (
            <TranslatedText
              stringId="medication.warningModal.singleMedication.description2"
              fallback="Would you like to continue prescribing this medication set which will cause the existing ongoing medications to be discontinued on finalisation or would you like to cancel creating the prescription?"
            />
          )}
        </Description>
        {isCreatingMedicationSet && (
          <Box mt={2.5}>
            <TableTitle>
              <TranslatedText
                stringId="medication.warningModal.medicationSetMedications"
                fallback="Medication set medications"
              />
            </TableTitle>
            <Box display={'flex'} flexWrap={'wrap'} gap={2}>
              {warningMedications.map((medication, index) => (
                <StyledMedicationSummary key={index} medication={medication} showTitle={false} />
              ))}
            </Box>
          </Box>
        )}
        <Box mt={2.5}>
          {isCreatingMedicationSet && (
            <TableTitle>
              <TranslatedText
                stringId="medication.warningModal.existingOngoingMedications"
                fallback="Existing ongoing medications"
              />
            </TableTitle>
          )}
          <StyledTable
            data={existingOngoingPrescriptions}
            columns={COLUMNS(getTranslation, getEnumTranslation)}
            disablePagination
            allowExport={false}
          />
        </Box>
      </Box>
    </StyledModal>
  );
};
