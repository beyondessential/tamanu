import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Box, IconButton } from '@material-ui/core';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { MarkPatientForSync } from './MarkPatientForSync';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE, PATIENT_STATUS_COLORS } from '../constants';
import { LocationGroupCell } from './LocationCell';
import { LimitedLinesCell } from './FormattedTableCell';
import { TranslatedText } from './Translation/TranslatedText';
import { DeleteEncounterModal } from '../views/patients/components/DeleteEncounterModal';
import { MenuButton } from './MenuButton';
import { useSyncState } from '../contexts/SyncState';
import { useRefreshCount } from '../hooks/useRefreshCount';
import { useAuth } from '../contexts/Auth';
import { TranslatedReferenceData } from './Translation/index.js';
import { Heading4 } from './Typography.js';
import { getPatientStatus } from '../utils/getPatientStatus.js';
import { TranslationContext, useTranslation } from '../contexts/Translation.jsx';
import { ThemedTooltip } from './Tooltip.jsx';

const DateWrapper = styled.div`
  position: relative;
  min-width: 90px;
  min-height: 36px;
  display: flex;
  align-items: center;
`;

const FacilityWrapper = styled.div`
  min-width: 100px;
`;

const ReasonForEncounterWrapper = styled.div`
  min-width: 325px;
`;

const StyledTable = styled(DataFetchingTable)`
  box-shadow: none;
  padding: 0 21px;
  .MuiTableCell-head {
    border-top: 1px solid ${Colors.outline};
    background-color: ${Colors.white};
    padding-top: 8px;
    padding-bottom: 8px;
    span {
      font-weight: 400;
      color: ${Colors.midText};
    }
    padding-left: 6px;
    padding-right: 6px;
    &:first-child {
      padding-left: 0px;
    }
    &:last-child {
      padding: 0;
      width: 22px;
    }
  }
  .MuiTableRow-root {
    &:not(.statusRow):hover:not(:has(.menu-container:hover)) {
      .MuiTableCell-body {
        &:first-child {
          &:before {
            content: '';
            position: absolute;
            top: 0;
            left: -6px;
            border-radius: 5px 0 0 5px;
            display: block;
            width: 6px;
            height: 100%;
            background-color: ${Colors.veryLightBlue};
          }
        }
        &:last-child {
          &:after {
            content: '';
            position: absolute;
            top: 0;
            right: -6px;
            border-radius: 0 5px 5px 0;
            display: block;
            width: 6px;
            height: 100%;
            background-color: ${Colors.veryLightBlue};
          }
        }
      }
    }
  }
  .MuiTableCell-body {
    padding-top: 11px;
    padding-bottom: 11px;
    padding-left: 6px;
    padding-right: 6px;
    position: relative;
    &:first-child {
      padding-left: 0px;
    }
    &:last-child {
      padding: 0;
      width: 22px;
    }
  }
  .MuiTableBody-root .MuiTableRow-root {
    &:hover:has(.menu-container:hover) {
      background-color: transparent;
    }
  }
  .MuiTableFooter-root {
    background-color: ${Colors.white};
    .MuiPagination-root {
      padding-top: 6px;
      padding-bottom: 6px;
      margin-right: 0;
    }
    .MuiTableCell-footer {
      padding-left: 0px;
    }
  }
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: -3px;
  left: -11px;
  width: 5px;
  height: 44px;
  border-radius: 10px;
  background-color: ${p =>
    p.patientStatus ? PATIENT_STATUS_COLORS[p.patientStatus] : Colors.white};
  ${p => (!p.patientStatus ? `border: 1px solid ${PATIENT_STATUS_COLORS[p.patientStatus]};` : '')}
`;

const StyledIconButton = styled(IconButton)`
  font-size: 20px;
`;

const MenuContainer = styled.div`
  position: relative;
  left: 15px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 50%;
  }
  z-index: 1;
`;

const StyledMenuButton = styled(MenuButton)`
  .MuiIconButton-root {
    &:hover {
      background-color: transparent;
    }
  }
`;

const getDate = ({ startDate, endDate, encounterType }) => {
  const patientStatus = getPatientStatus(encounterType);
  return (
    <DateWrapper>
      <div>
        <StatusIndicator patientStatus={patientStatus} />
        <DateDisplay date={startDate} data-test-id='datedisplay-flb0' />
        &nbsp;&ndash;{' '}
        {endDate ? (
          <DateDisplay date={endDate} data-test-id='datedisplay-2o8e' />
        ) : (
          <TranslatedText
            stringId="general.date.current"
            fallback="Current"
            data-test-id='translatedtext-m3sc' />
        )}
      </div>
    </DateWrapper>
  );
};
const getType = ({ encounterType }) => ENCOUNTER_OPTIONS_BY_VALUE[encounterType].label;
const getReasonForEncounter = ({ reasonForEncounter }) => (
  <ReasonForEncounterWrapper>{reasonForEncounter}</ReasonForEncounterWrapper>
);
const getFacility = ({ facilityName, facilityId }) => (
  <FacilityWrapper>
    {facilityId ? (
      <TranslatedReferenceData
        category="facility"
        fallback={facilityName}
        value={facilityId}
        data-test-id='translatedreferencedata-ti2y' />
    ) : (
      { facilityName }
    )}
  </FacilityWrapper>
);

const SyncWarning = styled.p`
  margin: 1rem;
`;

const SyncWarningBanner = ({ patient, onRefresh }) => {
  const syncState = useSyncState();
  const isSyncing = syncState.isPatientSyncing(patient.id);
  const [wasSyncing, setWasSyncing] = useState(isSyncing);

  if (isSyncing !== wasSyncing) {
    setWasSyncing(isSyncing);
    // refresh the table on a timeout so we aren't updating two components at once
    setTimeout(onRefresh, 100);
  }

  if (!isSyncing) return null;

  return (
    <SyncWarning>
      <TranslatedText
        stringId="patient.history.syncWarning"
        fallback="Patient is being synced, so records might not be fully updated."
        data-test-id='translatedtext-85v7' />
    </SyncWarning>
  );
};

export const PatientHistory = ({ patient, onItemClick }) => {
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const queryClient = useQueryClient();
  const { ability } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEncounterData, setSelectedEncounterData] = useState(null);
  const translationContext = useTranslation();

  const actions = [
    {
      label: <TranslatedText
        stringId="general.action.delete"
        fallback="Delete"
        data-test-id='translatedtext-c35l' />,
      action: () => setModalOpen(true),
      permissionCheck: () => {
        return ability?.can('delete', 'Encounter');
      },
    },
  ].filter(({ permissionCheck }) => {
    return permissionCheck ? permissionCheck() : true;
  });

  const columns = [
    {
      key: 'startDate',
      title: <TranslatedText
        stringId="general.date.label"
        fallback="Date"
        data-test-id='translatedtext-cfqb' />,
      accessor: getDate,
    },
    {
      key: 'encounterType',
      title: <TranslatedText
        stringId="encounter.type.label"
        fallback="Type"
        data-test-id='translatedtext-1qf5' />,
      accessor: getType,
    },
    {
      key: 'facilityName',
      title: <TranslatedText
        stringId="general.table.column.facilityName"
        fallback="Facility"
        data-test-id='translatedtext-6s0h' />,
      accessor: getFacility,
      CellComponent: LimitedLinesCell,
    },
    {
      key: 'locationGroupName',
      title: <TranslatedText
        stringId="general.table.column.area"
        fallback="Area"
        data-test-id='translatedtext-pwk9' />,
      accessor: props => (
        // Component will be detached from context if an inline function is passed to the accessor, so another provider wrapping is needed
        (<TranslationContext.Provider value={translationContext}>
          <LocationGroupCell style={{ minWidth: 45 }} {...props} />
        </TranslationContext.Provider>)
      ),
      CellComponent: LimitedLinesCell,
    },
    {
      key: 'reasonForEncounter',
      title: (
        <TranslatedText
          stringId="encounter.reasonForEncounter.label"
          fallback="Reason for encounter"
          data-test-id='translatedtext-fzpb' />
      ),
      accessor: getReasonForEncounter,
      sortable: false,
      CellComponent: LimitedLinesCell,
    },
  ];

  // Only include actions column when there is at least one action
  if (actions.length > 0) {
    columns.push({
      // key and title are empty strings to display a blank column name
      key: '',
      title: '',
      sortable: false,
      dontCallRowInput: true,
      CellComponent: ({ data }) => (
        <MenuContainer
          className="menu-container"
          onMouseEnter={() => setSelectedEncounterData(data)}
        >
          <StyledMenuButton actions={actions} data-test-id='styledmenubutton-lo18' />
        </MenuContainer>
      ),
    });
  }

  if (!patient.markedForSync) {
    return <MarkPatientForSync patient={patient} />;
  }
  return (
    <>
      <SyncWarningBanner patient={patient} onRefresh={updateRefreshCount} />
      <StyledTable
        columns={columns}
        onRowClick={row => onItemClick(row.id)}
        noDataMessage={
          <Box mx="auto" p="40px">
            <TranslatedText
              stringId="patient.history.table.noDataMessage"
              fallback="No encounter records to display"
              data-test-id='translatedtext-62sa' />
          </Box>
        }
        endpoint={`patient/${patient.id}/encounters`}
        initialSort={{ orderBy: 'startDate', order: 'desc' }}
        refreshCount={refreshCount}
        TableHeader={
          <Heading4 mt="15px" mb="15px">
            <TranslatedText
              stringId="patient.history.table.encounterHistory"
              fallback="Encounter history"
              data-test-id='translatedtext-wtyu' />
          </Heading4>
        }
        ExportButton={props => (
          <ThemedTooltip
            title={<TranslatedText
              stringId="general.action.export"
              fallback="Export"
              data-test-id='translatedtext-gdpd' />}
          >
            <StyledIconButton size="small" variant="outlined" {...props}>
              <GetAppIcon />
            </StyledIconButton>
          </ThemedTooltip>
        )}
      />
      <DeleteEncounterModal
        open={modalOpen}
        encounterToDelete={selectedEncounterData}
        patient={patient}
        onClose={() => {
          setModalOpen(false);
          queryClient.invalidateQueries(['patientCurrentEncounter', patient.id]);
          updateRefreshCount();
        }}
      />
    </>
  );
};
