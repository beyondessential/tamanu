import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Box, IconButton } from '@material-ui/core';

import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { TranslationContext, useTranslation } from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { MarkPatientForSync } from './MarkPatientForSync';
import { PATIENT_STATUS_COLORS } from '../constants';
import { LocationGroupCell } from './LocationCell';
import { LimitedLinesCell } from './FormattedTableCell';
import { TranslatedText } from './Translation/TranslatedText';
import { DeleteEncounterModal } from '../views/patients/components/DeleteEncounterModal';
import { MenuButton } from './MenuButton';
import { useSyncState } from '../contexts/SyncState';
import { useRefreshCount } from '../hooks/useRefreshCount';
import { useAuth } from '../contexts/Auth';
import { TranslatedEnum, TranslatedReferenceData } from './Translation/index.js';
import { Heading4 } from './Typography.js';
import { getPatientStatus } from '../utils/getPatientStatus.js';
import { ThemedTooltip } from './Tooltip.jsx';
import { NoteModalActionBlocker } from './NoteModalActionBlocker.jsx';
import { PatientHistorySearch } from './PatientHistorySearch.jsx';

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
    <DateWrapper data-testid="datewrapper-5lb0">
      <div>
        <StatusIndicator patientStatus={patientStatus} data-testid="statusindicator-c389" />
        <DateDisplay date={startDate} data-testid="datedisplay-kvmn" />
        &nbsp;&ndash;{' '}
        {endDate ? (
          <DateDisplay date={endDate} data-testid="datedisplay-k7rd" />
        ) : (
          <TranslatedText
            stringId="general.date.current"
            fallback="Current"
            data-testid="translatedtext-kxsz"
          />
        )}
      </div>
    </DateWrapper>
  );
};
const getType = ({ encounterType }) => (
  <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={encounterType} />
);
const getReasonForEncounter = ({ reasonForEncounter }) => (
  <ReasonForEncounterWrapper data-testid="reasonforencounterwrapper-7vsk">
    {reasonForEncounter}
  </ReasonForEncounterWrapper>
);
const getFacility = ({ facilityName, facilityId }) => (
  <FacilityWrapper data-testid="facilitywrapper-s4m4">
    {facilityId ? (
      <TranslatedReferenceData
        category="facility"
        fallback={facilityName}
        value={facilityId}
        data-testid="translatedreferencedata-o3fw"
      />
    ) : (
      { facilityName }
    )}
  </FacilityWrapper>
);
const getClinician = ({ clinicianName }) => (
  <FacilityWrapper data-testid="clinicianwrapper-8m5n">{clinicianName || '-'}</FacilityWrapper>
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
    <SyncWarning data-testid="syncwarning-5go9">
      <TranslatedText
        stringId="patient.history.syncWarning"
        fallback="Patient is being synced, so records might not be fully updated."
        data-testid="translatedtext-upt5"
      />
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
      label: (
        <TranslatedText
          stringId="general.action.delete"
          fallback="Delete"
          data-testid="translatedtext-yzqv"
        />
      ),
      action: () => setModalOpen(true),
      permissionCheck: () => {
        return ability?.can('delete', 'Encounter');
      },
      wrapper: actionButton => <NoteModalActionBlocker>{actionButton}</NoteModalActionBlocker>,
    },
  ].filter(({ permissionCheck }) => {
    return permissionCheck ? permissionCheck() : true;
  });

  const columns = [
    {
      key: 'startDate',
      title: (
        <TranslatedText
          stringId="general.date.label"
          fallback="Date"
          data-testid="translatedtext-wank"
        />
      ),
      accessor: getDate,
    },
    {
      key: 'encounterType',
      title: (
        <TranslatedText
          stringId="encounter.type.label"
          fallback="Type"
          data-testid="translatedtext-sj3a"
        />
      ),
      accessor: getType,
    },
    {
      key: 'facilityName',
      title: (
        <TranslatedText
          stringId="general.table.column.facilityName"
          fallback="Facility"
          data-testid="translatedtext-w2dq"
        />
      ),
      accessor: getFacility,
      CellComponent: LimitedLinesCell,
    },
    {
      key: 'clinicianName',
      title: (
        <TranslatedText
          stringId="general.localisedField.clinician.label.short"
          fallback="Clinician"
          data-testid="translatedtext-clinician"
        />
      ),
      accessor: getClinician,
      CellComponent: LimitedLinesCell,
    },
    {
      key: 'locationGroupName',
      title: (
        <TranslatedText
          stringId="general.table.column.area"
          fallback="Area"
          data-testid="translatedtext-joqe"
        />
      ),
      accessor: props => (
        // Component will be detached from context if an inline function is passed to the accessor, so another provider wrapping is needed
        <TranslationContext.Provider value={translationContext} data-testid="provider-s1e7">
          <LocationGroupCell
            style={{ minWidth: 45 }}
            {...props}
            data-testid="locationgroupcell-loyq"
          />
        </TranslationContext.Provider>
      ),
      CellComponent: LimitedLinesCell,
    },
    {
      key: 'reasonForEncounter',
      title: (
        <TranslatedText
          stringId="encounter.reasonForEncounter.label"
          fallback="Reason for encounter"
          data-testid="translatedtext-3qx2"
        />
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
          data-testid="menucontainer-ox22"
        >
          <StyledMenuButton actions={actions} data-testid="styledmenubutton-rtq7" />
        </MenuContainer>
      ),
    });
  }

  if (!patient.markedForSync) {
    return <MarkPatientForSync patient={patient} data-testid="markpatientforsync-t5tf" />;
  }
  return (
    <>
      <SyncWarningBanner
        patient={patient}
        onRefresh={updateRefreshCount}
        data-testid="syncwarningbanner-hi4l"
      />
      <StyledTable
        columns={columns}
        onRowClick={row => onItemClick(row.id)}
        noDataMessage={
          <Box mx="auto" p="40px" data-testid="box-t8fy">
            <TranslatedText
              stringId="patient.history.table.noDataMessage"
              fallback="No encounter records to display"
              data-testid="translatedtext-1759"
            />
          </Box>
        }
        endpoint={`patient/${patient.id}/encounters`}
        initialSort={{ orderBy: 'startDate', order: 'desc' }}
        refreshCount={refreshCount}
        TableHeader={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Heading4 mt="15px" mb="15px" data-testid="heading4-ssa1">
              <TranslatedText
                stringId="patient.history.table.encounterHistory"
                fallback="Encounter history"
                data-testid="translatedtext-nmkf"
              />
            </Heading4>
            <PatientHistorySearch />
          </Box>
        }
        ExportButton={props => (
          <ThemedTooltip
            title={
              <TranslatedText
                stringId="general.action.export"
                fallback="Export"
                data-testid="translatedtext-nap8"
              />
            }
            data-testid="themedtooltip-0jfc"
          >
            <StyledIconButton
              size="small"
              variant="outlined"
              {...props}
              data-testid="stylediconbutton-bjog"
            >
              <GetAppIcon data-testid="getappicon-ccvs" />
            </StyledIconButton>
          </ThemedTooltip>
        )}
        data-testid="styledtable-6fdu"
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
        data-testid="deleteencountermodal-0psi"
      />
    </>
  );
};
