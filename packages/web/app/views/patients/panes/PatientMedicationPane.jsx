import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@mui/material';

import {
  Button,
  TranslatedText,
  TranslatedReferenceData,
  TranslatedEnum,
} from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { PATIENT_STATUS_COLORS } from '../../../constants';
import { formatShortest } from '../../../components/DateDisplay';
import { DataFetchingTable } from '../../../components/Table';

import { usePatientCurrentEncounterQuery } from '../../../api/queries';
import { getPatientStatus } from '../../../utils/getPatientStatus';

import { ConditionalTooltip, ThemedTooltip } from '../../../components/Tooltip';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { useTranslation } from '../../../contexts/Translation';
import { DRUG_ROUTE_LABELS, DRUG_STOCK_STATUSES } from '@tamanu/constants';
import { MedicationModal } from '../../../components/Medication/MedicationModal';
import { MedicationDetails } from '../../../components/Medication/MedicationDetails';
import { PharmacyOrderModal } from '../../../components/Medication/PharmacyOrderModal';
import { useAuth } from '../../../contexts/Auth';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { SendToPharmacyIcon } from '../../../assets/icons/SendToPharmacyIcon';
import { useSettings } from '../../../contexts/Settings';

const NotifyBanner = styled(Box)`
  padding: 13px 22px;
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  background-color: ${Colors.white};
  font-size: 14px;
  font-weight: 400;
  color: ${Colors.darkestText};
  position: relative;
  margin-top: 10px;
  margin-bottom: -10px;
  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    width: 10px;
    height: calc(100% + 2px);
    background-color: ${props => PATIENT_STATUS_COLORS[props.patientStatus]};
    border-radius: 5px 0 0 5px;
  }
`;

const TableContainer = styled(Box)`
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
  margin-top: 20px;
`;

const TableTitle = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${Colors.outline};
`;

const TableTitleText = styled(Box)`
  font-size: 16px;
  font-weight: 500;
  line-height: 21px;
  color: ${Colors.darkestText};
`;

const TableTitleNote = styled(Box)`
  font-size: 16px;
  font-weight: 400;
  line-height: 21px;
  color: ${Colors.midText};
`;

const DarkestText = styled(Box)`
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: ${Colors.darkestText};
`;

const DarkText = styled(Box)`
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: ${Colors.darkText};
`;

const StyledConditionalTooltip = styled(ConditionalTooltip)`
  .MuiTooltip-tooltip {
    max-width: 180px;
    padding: 8px 16px;
    font-size: 11px;
    font-weight: 400;
  }
`;

const ButtonGroup = styled(Box)`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const SendToPharmacyButton = styled.div`
  cursor: pointer;
`;
const NoMedicationTooltip = styled(ConditionalTooltip)`
  width: fit-content;
  .MuiTooltip-tooltip {
    max-width: 150px;
    padding: 8px 16px;
    font-size: 11px;
    font-weight: 400;
  }
`;

const NoDataContainer = styled.div`
  height: 230px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 20px;
  margin-bottom: 20px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.hoverGrey};
  color: ${Colors.primary};
`;

const CellText = styled.div`
  text-decoration: ${props => (props.discontinued ? 'line-through' : 'none')};
`;

const StyledDataFetchingTable = styled(DataFetchingTable)`
  padding-left: 20px;
  padding-right: 20px;
  border: none;
  box-shadow: none;
  max-height: ${props => (props.$noData ? '270px' : props.$maxHeight)};
  .MuiTableHead-root {
    ${props => props.$noData && 'display: none;'}
    .MuiTableRow-root .MuiTableCell-head {
      &:first-child {
        padding-left: 10px;
      }
      background-color: ${Colors.white};
      padding-top: 8px;
      padding-bottom: 8px;
      font-weight: 400;
      color: ${Colors.midText};
      position: sticky;
      top: 0;
      & .MuiTableSortLabel-root {
        color: ${Colors.midText};
      }
    }
  }
  .MuiTableBody-root {
    .MuiTableRow-root .MuiTableCell-body {
      &:first-child {
        padding-left: ${props => (props.$noData ? '0' : '10px')};
      }
      ${props => props.$noData && 'padding: 0;'}
    }
    .MuiTableRow-root:last-child .MuiTableCell-body {
      border-bottom: none;
    }
    .MuiTableRow-root {
      cursor: ${props => (props.$noData ? 'default' : 'pointer')};
      &:hover {
        background-color: ${props => (props.$noData ? 'transparent' : Colors.veryLightBlue)};
      }
    }
  }
  .MuiTableFooter-root {
    position: sticky;
    bottom: 0;
    background-color: ${Colors.white};
    .MuiPagination-root {
      padding-top: 10px;
      padding-bottom: 10px;
    }
    td {
      border-top: 1px solid ${Colors.outline};
    }
  }
`;

const isUnavailableAtFacility = medication =>
  medication?.referenceDrug?.facilities?.[0]?.stockStatus === DRUG_STOCK_STATUSES.UNAVAILABLE;

const ONGOING_MEDICATION_COLUMNS = (getTranslation, getEnumTranslation) => [
  {
    key: 'medication.name',
    title: (
      <TranslatedText stringId="patient.medication.table.column.medication" fallback="Medication" />
    ),
    sortable: true,
    accessor: data => {
      return (
        <NoMedicationTooltip
          visible={isUnavailableAtFacility(data?.medication)}
          title={
            <TranslatedText
              stringId="patient.medication.unavailable.tooltip"
              fallback="This medication is not available at this facility"
            />
          }
        >
          <CellText discontinued={data?.discontinued}>
            <TranslatedReferenceData
              fallback={data?.medication?.name}
              value={data?.medication?.id}
              category={data?.medication?.type}
            />
          </CellText>
        </NoMedicationTooltip>
      );
    },
  },
  {
    key: 'dose',
    title: <TranslatedText stringId="patient.medication.table.column.dose" fallback="Dose" />,
    accessor: data => (
      <CellText discontinued={data?.discontinued}>
        {getMedicationDoseDisplay(data, getTranslation, getEnumTranslation)}
        {data.isPrn && ` ${getTranslation('patient.medication.table.prn', 'PRN')}`}
      </CellText>
    ),
    sortable: false,
  },
  {
    key: 'frequency',
    title: (
      <TranslatedText stringId="patient.medication.table.column.frequency" fallback="Frequency" />
    ),
    accessor: data => (
      <CellText discontinued={data?.discontinued}>
        {data.frequency ? getTranslatedFrequency(data.frequency, getTranslation) : ''}
      </CellText>
    ),
    sortable: false,
  },
  {
    key: 'route',
    title: <TranslatedText stringId="patient.medication.table.column.route" fallback="Route" />,
    accessor: data => (
      <CellText discontinued={data?.discontinued}>
        <TranslatedEnum value={data.route} enumValues={DRUG_ROUTE_LABELS} />
      </CellText>
    ),
    sortable: true,
  },
  {
    key: 'date',
    title: <TranslatedText stringId="patient.medication.table.column.date" fallback="Date" />,
    accessor: data => (
      <CellText discontinued={data?.discontinued}>{`${formatShortest(data.date)}`}</CellText>
    ),
    sortable: true,
  },
  {
    key: 'prescriber.displayName',
    title: (
      <TranslatedText stringId="patient.medication.table.column.prescriber" fallback="Prescriber" />
    ),
    accessor: data => (
      <CellText discontinued={data?.discontinued}>{data?.prescriber?.displayName ?? ''}</CellText>
    ),
    sortable: true,
  },
];

const DISCHARGE_MEDICATION_COLUMNS = (getTranslation, getEnumTranslation) => [
  {
    key: 'medication.name',
    title: (
      <TranslatedText stringId="patient.medication.table.column.medication" fallback="Medication" />
    ),
    sortable: true,
    accessor: data => (
      <TranslatedReferenceData
        fallback={data?.medication?.name}
        value={data?.medication?.id}
        category={data?.medication?.type}
      />
    ),
  },
  {
    key: 'quantity',
    title: (
      <TranslatedText stringId="patient.medication.table.column.quantity" fallback="Quantity" />
    ),
    sortable: false,
    accessor: data => data?.quantity,
  },
  {
    key: 'repeats',
    title: <TranslatedText stringId="patient.medication.table.column.repeats" fallback="Repeats" />,
    sortable: false,
    accessor: data => data?.repeats,
  },
  {
    key: 'dose',
    title: <TranslatedText stringId="patient.medication.table.column.dose" fallback="Dose" />,
    accessor: data => (
      <>
        {getMedicationDoseDisplay(data, getTranslation, getEnumTranslation)}
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
    key: 'prescriber.displayName',
    title: (
      <TranslatedText stringId="patient.medication.table.column.prescriber" fallback="Prescriber" />
    ),
    accessor: data => data?.prescriber?.displayName ?? '',
    sortable: true,
  },
];

export const PatientMedicationPane = ({ patient }) => {
  const { ability, facilityId } = useAuth();
  const { getSetting } = useSettings();
  const { data: currentEncounter } = usePatientCurrentEncounterQuery(patient.id);
  const patientStatus = getPatientStatus(currentEncounter?.encounterType);

  const { getTranslation, getEnumTranslation } = useTranslation();

  const [ongoingPrescriptions, setOngoingPrescriptions] = useState([]);
  const [dischargeMedications, setDischargeMedications] = useState([]);
  const [lastInpatientEncounter, setLastInpatientEncounter] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [createMedicationModalOpen, setCreateMedicationModalOpen] = useState(false);
  const [sendToPharmacyModalOpen, setSendToPharmacyModalOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [allowDiscontinue, setAllowDiscontinue] = useState(false);

  const canCreateOngoingPrescription = ability.can('create', 'Medication');
  const canViewSensitiveMedications = ability.can('read', 'SensitiveMedication');
  const pharmacyOrderEnabled = getSetting('features.pharmacyOrder.enabled');

  // Filter active (non-discontinued) ongoing prescriptions for send to pharmacy
  const activeOngoingPrescriptions = ongoingPrescriptions.filter(p => !p.discontinued);
  const hasActiveOngoingPrescriptions = activeOngoingPrescriptions.length > 0;

  const onOngoingPrescriptionsFetched = useCallback(({ data }) => {
    setOngoingPrescriptions(data);
  }, []);

  const onDischargeMedicationsFetched = useCallback(({ data, otherData }) => {
    setDischargeMedications(data);
    setLastInpatientEncounter(otherData?.lastInpatientEncounter);
  }, []);

  const handleSavedOngoingPrescription = () => {
    setRefreshCount(prev => prev + 1);
    setCreateMedicationModalOpen(false);
  };

  const handleReloadOngoingPrescriptions = () => {
    setRefreshCount(prev => prev + 1);
    setSelectedMedication(null);
  };

  const handleSendToPharmacySubmit = () => {
    setRefreshCount(prev => prev + 1);
  };

  const handleOngoingPrescriptionClick = (_, data) => {
    const isSensitive = data?.medication?.referenceDrug?.isSensitive;
    if (isSensitive && !canViewSensitiveMedications) {
      return;
    }
    if (isUnavailableAtFacility(data?.medication)) {
      return;
    }
    setSelectedMedication(data);
    setAllowDiscontinue(true);
  };

  const handleDischargeMedicationClick = (_, data) => {
    const isSensitive = data?.medication?.referenceDrug?.isSensitive;
    if (isSensitive && !canViewSensitiveMedications) {
      return;
    }
    setSelectedMedication(data);
    setAllowDiscontinue(false);
  };

  const rowStyle = ({ medication }) => `
    ${
      medication?.referenceDrug?.isSensitive && !canViewSensitiveMedications
        ? 'pointer-events: none;'
        : ''
    }
    ${isUnavailableAtFacility(medication) ? 'opacity: 0.5; cursor: default !important;' : ''}
  `;

  return (
    <Box px={2.5} pb={2.5} overflow={'auto'}>
      {currentEncounter && (
        <NotifyBanner patientStatus={patientStatus}>
          <TranslatedText
            stringId="patient.medication.warning.activeEncounter"
            fallback="This patient has an active encounter and these ongoing medications may change on discharge."
          />
        </NotifyBanner>
      )}
      <TableContainer>
        <TableTitle py={1.5} mx={2.5}>
          <TableTitleText>
            <TranslatedText
              stringId="patient.medication.ongoing.title"
              fallback="Ongoing medications"
            />
          </TableTitleText>
          <ButtonGroup>
            {pharmacyOrderEnabled && hasActiveOngoingPrescriptions && (
              <StyledConditionalTooltip
                visible={!!currentEncounter}
                title={
                  <TranslatedText
                    stringId="patient.medication.ongoing.sendToPharmacy.activeEncounter.tooltip"
                    fallback="Cannot send to pharmacy while patient has an active encounter. Please use the encounter medication workflow instead."
                  />
                }
                PopperProps={{
                  popperOptions: {
                    positionFixed: true,
                    modifiers: {
                      flip: {
                        enabled: false,
                      },
                      preventOverflow: {
                        enabled: false,
                      },
                    },
                  },
                }}
              >
                <NoteModalActionBlocker>
                  <ThemedTooltip
                    PopperProps={{
                      popperOptions: {
                        positionFixed: true,
                        modifiers: {
                          flip: {
                            enabled: false,
                          },
                          preventOverflow: {
                            enabled: false,
                          },
                        },
                      },
                    }}
                    title={
                      !currentEncounter ? (
                        <Box width="120px" fontWeight={400}>
                          <TranslatedText
                            stringId="patient.medication.ongoing.sendToPharmacy.tooltip"
                            fallback="Send to pharmacy"
                          />
                        </Box>
                      ) : (
                        ''
                      )
                    }
                  >
                    <SendToPharmacyButton
                      disabled={!!currentEncounter}
                      onClick={() => setSendToPharmacyModalOpen(true)}
                    >
                      <SendToPharmacyIcon />
                    </SendToPharmacyButton>
                  </ThemedTooltip>
                </NoteModalActionBlocker>
              </StyledConditionalTooltip>
            )}
            {canCreateOngoingPrescription && (
              <StyledConditionalTooltip
                visible={!!currentEncounter}
                title={
                  <TranslatedText
                    stringId="patient.medication.ongoing.add.warning"
                    fallback="Please add any medications via the patient active encounter."
                  />
                }
                PopperProps={{
                  popperOptions: {
                    positionFixed: true,
                    modifiers: {
                      flip: {
                        enabled: false,
                      },
                      preventOverflow: {
                        enabled: false,
                      },
                    },
                  },
                }}
              >
                <NoteModalActionBlocker>
                  <Button
                    disabled={!!currentEncounter}
                    onClick={() => setCreateMedicationModalOpen(true)}
                  >
                    <TranslatedText
                      stringId="patient.medication.ongoing.add"
                      fallback="Add ongoing medication"
                    />
                  </Button>
                </NoteModalActionBlocker>
              </StyledConditionalTooltip>
            )}
          </ButtonGroup>
        </TableTitle>
        <StyledDataFetchingTable
          endpoint={`/patient/${patient.id}/ongoing-prescriptions`}
          fetchOptions={{ facilityId }}
          columns={ONGOING_MEDICATION_COLUMNS(getTranslation, getEnumTranslation)}
          rowStyle={rowStyle}
          noDataMessage={
            <NoDataContainer>
              <TranslatedText
                stringId="patient.medication.ongoing.table.noData"
                fallback="No ongoing medications to display."
              />
            </NoDataContainer>
          }
          allowExport={false}
          onDataFetched={onOngoingPrescriptionsFetched}
          $noData={ongoingPrescriptions.length === 0}
          refreshCount={refreshCount}
          onClickRow={handleOngoingPrescriptionClick}
          $maxHeight={'320px'}
        />
      </TableContainer>
      <TableContainer>
        <TableTitle py={2} mx={2.5}>
          <Box display={'flex'} alignItems={'center'} gap={0.5}>
            <TableTitleText>
              <TranslatedText
                stringId="patient.medication.discharge.title"
                fallback="Discharge medications"
              />
              {' | '}
            </TableTitleText>
            <TableTitleNote>
              <TranslatedText
                stringId="patient.medication.discharge.lastInpatientEncounter"
                fallback="Last inpatient encounter"
              />
            </TableTitleNote>
          </Box>
          {lastInpatientEncounter && (
            <Box display={'flex'} alignItems={'center'} gap={0.25}>
              <DarkestText>{lastInpatientEncounter.discharge.facilityName} |</DarkestText>
              <DarkText>
                <TranslatedText
                  stringId="patient.medication.discharge.discharged"
                  fallback="Discharged"
                />
                {': '}
                {formatShortest(lastInpatientEncounter.endDate)}
              </DarkText>
            </Box>
          )}
        </TableTitle>
        <StyledDataFetchingTable
          endpoint={`/patient/${patient.id}/last-inpatient-discharge-medications`}
          columns={DISCHARGE_MEDICATION_COLUMNS(getTranslation, getEnumTranslation)}
          rowStyle={rowStyle}
          noDataMessage={
            <NoDataContainer>
              {lastInpatientEncounter ? (
                <TranslatedText
                  stringId="patient.medication.discharge.table.noDischargeMedications"
                  fallback="No last inpatient encounter discharge medications to display."
                />
              ) : (
                <TranslatedText
                  stringId="patient.medication.discharge.table.noLastInpatientEncounter"
                  fallback="This patient has had no inpatient encounters."
                />
              )}
            </NoDataContainer>
          }
          disablePagination
          allowExport={false}
          onDataFetched={onDischargeMedicationsFetched}
          $noData={dischargeMedications.length === 0}
          onClickRow={handleDischargeMedicationClick}
          $maxHeight={'270px'}
        />
      </TableContainer>
      <MedicationModal
        open={createMedicationModalOpen}
        onClose={() => setCreateMedicationModalOpen(false)}
        onSaved={handleSavedOngoingPrescription}
        isOngoingPrescription
      />
      <PharmacyOrderModal
        patient={patient}
        ongoingPrescriptions={activeOngoingPrescriptions}
        open={sendToPharmacyModalOpen}
        onClose={() => setSendToPharmacyModalOpen(false)}
        onSubmit={handleSendToPharmacySubmit}
      />
      {selectedMedication && (
        <MedicationDetails
          initialMedication={selectedMedication}
          onClose={() => setSelectedMedication(null)}
          isOngoingPrescription
          onReloadTable={handleReloadOngoingPrescriptions}
          allowDiscontinue={allowDiscontinue}
        />
      )}
    </Box>
  );
};
