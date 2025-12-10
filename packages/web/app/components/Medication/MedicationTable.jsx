import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { Box } from '@material-ui/core';
import { DRUG_ROUTE_LABELS, MEDICATION_DURATION_DISPLAY_UNITS_LABELS } from '@tamanu/constants';
import { useLocation, useNavigate } from 'react-router';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { Button } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';

import { DataFetchingTable } from '../Table';
import { formatShortest } from '../DateDisplay';
import { TranslatedText, TranslatedReferenceData, TranslatedEnum } from '../Translation';
import { useTranslation } from '../../contexts/Translation';
import { formatTimeSlot } from '../../utils/medications';
import { LimitedLinesCell } from '../FormattedTableCell';
import { ConditionalTooltip } from '../Tooltip';
import { MedicationDetails } from './MedicationDetails';
import { useApi } from '../../api';
import { singularize } from '../../utils';
import { useQueryClient } from '@tanstack/react-query';
import { AddMedicationIcon } from '../../assets/icons/AddMedicationIcon';
import { useAuth } from '../../contexts/Auth';

const StyledDataFetchingTable = styled(DataFetchingTable)`
  max-height: ${props => (props.$noData ? 'unset' : '51vh')};
  border: none;
  border-radius: 0;
  border-top: 1px solid ${Colors.outline};
  margin-top: 8px;
  .MuiTableHead-root {
    ${props => props.$noData && 'display: none;'}
    position: sticky;
    top: 0;
  }
  .MuiTableCell-head {
    background-color: ${Colors.white};
    padding-top: 12px;
    padding-bottom: 12px;
    span {
      font-weight: 400;
      color: ${Colors.midText};
    }
    padding-left: 10px;
    padding-right: 10px;
    &:last-child {
      padding-right: 10px;
    }
    &:first-child {
      padding-left: 10px;
    }
  }
  .MuiTableCell-body {
    padding: ${props => (props.$noData ? '10px' : '4px 10px')};
    height: 44px;
    &:last-child {
      padding-right: 10px;
    }
    &:first-child {
      padding-left: 10px;
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onClickRow ? 'pointer' : '')};
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
  .MuiTableBody-root {
    .MuiTableRow-root {
      &:last-child {
        td {
          border-bottom: none;
        }
      }
    }
  }
`;

const NoDataContainer = styled.div`
  height: 420px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.hoverGrey};
  color: ${Colors.primary};
  padding: 0 120px;
`;

const NoWrapCell = styled(Box)`
  white-space: nowrap;
`;

const StyledButton = styled(Button)`
  font-size: 12px;
  height: 36px;
  margin-top: 8px;
`;

const getMedicationName = (
  { medication, encounterPrescription, discontinued },
  getEnumTranslation,
) => {
  const pauseData = encounterPrescription?.pausePrescriptions?.[0];
  const isPausing = !!pauseData && !discontinued;

  return (
    <Box
      color={isPausing ? Colors.softText : 'inherit'}
      fontStyle={isPausing ? 'italic' : 'normal'}
    >
      <TranslatedReferenceData
        fallback={medication.name}
        value={medication.id}
        category={medication.type}
      />
      {isPausing && (
        <Box fontSize={'12px'}>
          (<TranslatedText stringId="medication.table.pausing" fallback="Paused" />,{' '}
          {pauseData.pauseDuration}{' '}
          {singularize(
            getEnumTranslation(MEDICATION_DURATION_DISPLAY_UNITS_LABELS, pauseData.pauseTimeUnit),
            pauseData.pauseDuration,
          ).toLowerCase()}{' '}
          - <TranslatedText stringId="medication.table.until" fallback="until" />{' '}
          {`${formatShortest(pauseData.pauseEndDate)} ${formatTimeSlot(pauseData.pauseEndDate)}`})
        </Box>
      )}
    </Box>
  );
};

const getFrequency = ({ frequency, encounterPrescription, discontinued }, getTranslation) => {
  if (!frequency) return '';
  const pauseData = encounterPrescription?.pausePrescriptions?.[0];
  const isPausing = !!pauseData && !discontinued;
  return (
    <Box
      color={isPausing ? Colors.softText : 'inherit'}
      fontStyle={isPausing ? 'italic' : 'normal'}
    >
      {getTranslatedFrequency(frequency, getTranslation)}
    </Box>
  );
};

const getMedicationColumns = (
  getTranslation,
  getEnumTranslation,
  disableTooltip,
  isPharmacyOrdersEnabled,
) => {
  const columns = [
    {
      key: 'medication.name',
      title: <TranslatedText stringId="medication.table.column.medication" fallback="Medication" />,
      accessor: data => getMedicationName(data, getEnumTranslation),
      CellComponent: props => <LimitedLinesCell {...props} disableTooltip={disableTooltip} />,
    },
    {
      key: 'dose',
      title: <TranslatedText stringId="medication.table.column.dose" fallback="Dose" />,
      accessor: data => {
        const pauseData = data.encounterPrescription?.pausePrescriptions?.[0];
        const isPausing = !!pauseData && !data.discontinued;
        return (
          <NoWrapCell
            color={isPausing ? Colors.softText : 'inherit'}
            fontStyle={isPausing ? 'italic' : 'normal'}
          >
            {getMedicationDoseDisplay(data, getTranslation, getEnumTranslation)}
            {data.isPrn && ` ${getTranslation('medication.table.prn', 'PRN')}`}
          </NoWrapCell>
        );
      },
      sortable: false,
    },
    {
      key: 'frequency',
      title: <TranslatedText stringId="medication.table.column.frequency" fallback="Frequency" />,
      accessor: data => getFrequency(data, getTranslation),
      sortable: false,
      CellComponent: LimitedLinesCell,
    },
    {
      key: 'route',
      title: <TranslatedText stringId="medication.route.label" fallback="Route" />,
      accessor: ({ route, encounterPrescription, discontinued }) => {
        const pauseData = encounterPrescription?.pausePrescriptions?.[0];
        const isPausing = !!pauseData && !discontinued;

        return (
          <NoWrapCell
            color={isPausing ? Colors.softText : 'inherit'}
            fontStyle={isPausing ? 'italic' : 'normal'}
          >
            <TranslatedEnum value={route} enumValues={DRUG_ROUTE_LABELS} />
          </NoWrapCell>
        );
      },
    },
    {
      key: 'date',
      tooltip: (
        <Box width="60px" fontWeight={400}>
          <TranslatedText stringId="medication.table.date.tooltip" fallback="Prescription date" />
        </Box>
      ),
      title: <TranslatedText stringId="general.date.label" fallback="Date" />,
      accessor: ({ date, endDate, isOngoing, discontinued, encounterPrescription }) => {
        const pauseData = encounterPrescription?.pausePrescriptions?.[0];
        const isPausing = !!pauseData && !discontinued;

        let tooltipTitle = '';
        if (endDate) {
          tooltipTitle = (
            <>
              <TranslatedText stringId="medication.table.endsOn.label" fallback="Ends on" />
              <div>{format(new Date(endDate), 'dd/MM/yy h:mma').toLowerCase()}</div>
            </>
          );
        } else if (isOngoing) {
          tooltipTitle = (
            <TranslatedText
              stringId="medication.table.ongoingMedication.label"
              fallback="Ongoing medication"
            />
          );
        }
        return (
          <NoWrapCell
            color={isPausing ? Colors.softText : 'inherit'}
            fontStyle={isPausing ? 'italic' : 'normal'}
          >
            <ConditionalTooltip
              visible={tooltipTitle}
              title={<Box fontWeight={400}>{tooltipTitle}</Box>}
            >
              {formatShortest(date)}
            </ConditionalTooltip>
          </NoWrapCell>
        );
      },
    },
    {
      key: 'prescriber.displayName',
      title: <TranslatedText stringId="medication.prescriber.label" fallback="Prescriber" />,
      accessor: ({ prescriber, encounterPrescription, discontinued }) => {
        const pauseData = encounterPrescription?.pausePrescriptions?.[0];
        const isPausing = !!pauseData && !discontinued;
        return (
          <Box
            color={isPausing ? Colors.softText : 'inherit'}
            fontStyle={isPausing ? 'italic' : 'normal'}
          >
            {prescriber?.displayName ?? ''}
          </Box>
        );
      },
      CellComponent: LimitedLinesCell,
    },
  ];

  if (isPharmacyOrdersEnabled) {
    columns.push({
      key: 'lastOrderedAt',
      tooltip: (
        <Box width="60px" fontWeight={400}>
          <TranslatedText
            stringId="medication.table.lastOrdered.tooltip"
            fallback="Date item was last ordered from pharmacy"
          />
        </Box>
      ),
      title: (
        <TranslatedText stringId="medication.table.column.lastOrdered" fallback="Last ordered" />
      ),
      sortable: false,
      accessor: ({ lastOrderedAt, encounterPrescription, discontinued }) => {
        const pauseData = encounterPrescription?.pausePrescriptions?.[0];
        const isPausing = !!pauseData && !discontinued;

        if (!lastOrderedAt) {
          return (
            <NoWrapCell
              color={isPausing ? Colors.softText : 'inherit'}
              fontStyle={isPausing ? 'italic' : 'normal'}
            >
              <TranslatedText
                stringId="general.fallback.notApplicable"
                fallback="N/A"
                casing="lower"
                data-testid="translatedtext-nc3a"
              />
            </NoWrapCell>
          );
        }

        const orderDate = new Date(lastOrderedAt);
        return (
          <NoWrapCell
            color={isPausing ? Colors.softText : 'inherit'}
            fontStyle={isPausing ? 'italic' : 'normal'}
          >
            <Box>
              {formatShortest(orderDate)}
              <Box fontSize="12px" color={Colors.softText}>
                {format(orderDate, 'h:mma').toLowerCase()}
              </Box>
            </Box>
          </NoWrapCell>
        );
      },
    });
  }

  return columns;
};

export const EncounterMedicationTable = ({
  encounter,
  canImportOngoingPrescriptions,
  onImportOngoingPrescriptions,
  isPharmacyOrdersEnabled = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { ability } = useAuth();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [medications, setMedications] = useState([]);

  const queryClient = useQueryClient();

  const canCreatePrescription = ability.can('create', 'Medication');
  const canViewSensitiveMedications = ability.can('read', 'SensitiveMedication');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const openMedicationId = searchParams.get('openMedicationId');
    if (openMedicationId) {
      handleInitialMedication(openMedicationId);
      navigate(location.pathname, { replace: true });
    }
  }, []);

  const handleInitialMedication = async id => {
    const medication = await api.get(`medication/${id}`);
    setSelectedMedication(medication);
  };

  const handleRefreshTable = () => {
    setRefreshCount(refreshCount + 1);
    queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
  };

  const onMedicationsFetched = useCallback(({ data }) => {
    setMedications(data);
  }, []);

  const rowStyle = ({ discontinued, medication }) => `
    ${discontinued ? 'text-decoration: line-through;' : ''}
    ${
      medication.referenceDrug.isSensitive && !canViewSensitiveMedications
        ? 'pointer-events: none;'
        : ''
    }
  `;

  const handleRowClick = row => {
    const isSensitive = row.medication.referenceDrug.isSensitive;
    if (isSensitive && !canViewSensitiveMedications) {
      return;
    }
    setSelectedMedication(row);
  };

  return (
    <div>
      {selectedMedication && (
        <MedicationDetails
          initialMedication={selectedMedication}
          onReloadTable={handleRefreshTable}
          onClose={() => setSelectedMedication(null)}
        />
      )}
      <StyledDataFetchingTable
        columns={getMedicationColumns(
          getTranslation,
          getEnumTranslation,
          !!selectedMedication,
          isPharmacyOrdersEnabled,
        )}
        endpoint={`encounter/${encounter.id}/medications`}
        initialSort={{ orderBy: 'date', order: 'asc' }}
        rowStyle={rowStyle}
        elevated={false}
        allowExport={false}
        disablePagination
        onRowClick={handleRowClick}
        refreshCount={refreshCount}
        onDataFetched={onMedicationsFetched}
        $noData={medications.length === 0}
        noDataMessage={
          <NoDataContainer>
            {canCreatePrescription && canImportOngoingPrescriptions ? (
              <Box
                color={Colors.darkestText}
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
              >
                <TranslatedText
                  stringId="medication.table.noMedicationsQuestion"
                  fallback="This patient has existing ongoing medications. Would you like to add these to this encounter?"
                />
                <StyledButton
                  variant="outlined"
                  color="primary"
                  onClick={onImportOngoingPrescriptions}
                >
                  <Box mr={1} display="flex">
                    <AddMedicationIcon />
                  </Box>
                  <TranslatedText
                    stringId="action.importMedications"
                    fallback="Import existing medications"
                  />
                </StyledButton>
              </Box>
            ) : canCreatePrescription && !encounter?.endDate ? (
              <TranslatedText
                stringId="medication.table.noMedicationsAndOngoing"
                fallback="No medications to display and no existing ongoing medications to add to encounter."
              />
            ) : (
              <TranslatedText
                stringId="medication.table.noMedications"
                fallback="No medications to display."
              />
            )}
          </NoDataContainer>
        }
      />
    </div>
  );
};
