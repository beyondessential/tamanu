import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Divider, Box } from '@material-ui/core';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { useParams } from 'react-router-dom';
import { useEncounter } from '../../contexts/Encounter';
import { useLocalisation } from '../../contexts/Localisation';
import { useAuth } from '../../contexts/Auth';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { Button, EncounterTopBar, connectRoutedModal, ContentPane } from '../../components';
import { DiagnosisView } from '../../components/DiagnosisView';
import { DischargeModal } from '../../components/DischargeModal';
import { MoveModal } from '../../components/MoveModal';
import { ChangeEncounterTypeModal } from '../../components/ChangeEncounterTypeModal';
import { ChangeDepartmentModal } from '../../components/ChangeDepartmentModal';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { Tabs } from '../../components/Tabs';
import {
  VitalsPane,
  NotesPane,
  ProcedurePane,
  LabsPane,
  ImagingPane,
  EncounterMedicationPane,
  DocumentsPane,
  EncounterProgramsPane,
  InvoicingPane,
  EncounterInfoPane,
} from './panes';
import { DropdownButton } from '../../components/DropdownButton';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE } from '../../constants';
import { ENCOUNTER_TAB_VALUES } from '../../constants/patientNavigation';

const getConnectRoutedModal = ({ category, patientId, encounterId }, suffix) =>
  connectRoutedModal(`/patients/${category}/${patientId}/encounter/${encounterId}`, suffix);

const getIsTriage = encounter => ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].triageFlowOnly;

const ENCOUNTER_TABS = [
  {
    label: 'Vitals',
    value: ENCOUNTER_TAB_VALUES.VITALS,
  },
  {
    label: 'Notes',
    value: ENCOUNTER_TAB_VALUES.NOTES,
  },
  {
    label: 'Procedures',
    value: ENCOUNTER_TAB_VALUES.PROCEDURES,
  },
  {
    label: 'Labs',
    value: ENCOUNTER_TAB_VALUES.LABS,
  },
  {
    label: 'Imaging',
    value: ENCOUNTER_TAB_VALUES.IMAGING,
  },
  {
    label: 'Medication',
    value: ENCOUNTER_TAB_VALUES.MEDICATION,
  },
  {
    label: 'Programs',
    value: ENCOUNTER_TAB_VALUES.PROGRAMS,
  },
  {
    label: 'Documents',
    value: ENCOUNTER_TAB_VALUES.DOCUMENTS,
  },
  {
    label: 'Invoicing',
    value: ENCOUNTER_TAB_VALUES.INVOICING,
    condition: getLocalisation => getLocalisation('features.enableInvoicing'),
  },
];

const TabContent = ({ value, ...props }) => {
  const Content = {
    [ENCOUNTER_TAB_VALUES.VITALS]: VitalsPane,
    [ENCOUNTER_TAB_VALUES.NOTES]: NotesPane,
    [ENCOUNTER_TAB_VALUES.PROCEDURES]: ProcedurePane,
    [ENCOUNTER_TAB_VALUES.LABS]: LabsPane,
    [ENCOUNTER_TAB_VALUES.IMAGING]: ImagingPane,
    [ENCOUNTER_TAB_VALUES.MEDICATION]: EncounterMedicationPane,
    [ENCOUNTER_TAB_VALUES.PROGRAMS]: EncounterProgramsPane,
    [ENCOUNTER_TAB_VALUES.DOCUMENTS]: DocumentsPane,
    [ENCOUNTER_TAB_VALUES.INVOICING]: InvoicingPane,
  }[value];
  return <Content {...props} />;
};

const EncounterActionDropdown = ({ encounter }) => {
  const { navigateToEncounter, navigateToSummary } = usePatientNavigation();
  const onChangeEncounterType = type => navigateToEncounter(encounter.id, `changeType/${type}`);
  const onChangeLocation = () => navigateToEncounter(encounter.id, 'move');
  const onDischargeOpen = () => navigateToEncounter(encounter.id, 'discharge');
  const onChangeDepartment = () => navigateToEncounter(encounter.id, 'changeDepartment');
  const onViewSummary = () => navigateToSummary();

  if (encounter.endDate) {
    return (
      <Button variant="outlined" color="primary" onClick={onViewSummary}>
        View discharge summary
      </Button>
    );
  }

  const progression = {
    [ENCOUNTER_TYPES.TRIAGE]: 0,
    [ENCOUNTER_TYPES.OBSERVATION]: 1,
    [ENCOUNTER_TYPES.EMERGENCY]: 2,
    [ENCOUNTER_TYPES.ADMISSION]: 3,
  };
  const isProgressionForward = (currentState, nextState) =>
    progression[nextState] > progression[currentState];

  const actions = [
    {
      label: 'Move to active ED care',
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.OBSERVATION),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.OBSERVATION),
    },
    {
      label: 'Move to emergency short stay',
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.EMERGENCY),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.EMERGENCY),
    },
    {
      label: 'Admit to hospital',
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.ADMISSION),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.ADMISSION),
    },
    // {
    //   label: 'Finalise location change',
    //   condition: () => encounter.plannedLocation,
    //   onClick: onFinaliseLocationChange,
    // },
    // {
    //   label: 'Cancel location change',
    //   condition: () => encounter.plannedLocation,
    //   onClick: onCancelLocationChange,
    // },
    {
      label: 'Discharge without being seen',
      onClick: onDischargeOpen,
      condition: () => encounter.encounterType === ENCOUNTER_TYPES.TRIAGE,
    },
    {
      label: 'Discharge',
      onClick: onDischargeOpen,
      condition: () => encounter.encounterType !== ENCOUNTER_TYPES.TRIAGE,
    },
    {
      label: 'Change department',
      onClick: onChangeDepartment,
    },
    {
      label: 'Change location',
      condition: () => !encounter.plannedLocation,
      onClick: onChangeLocation,
    },
  ].filter(action => !action.condition || action.condition());

  return <DropdownButton variant="outlined" actions={actions} />;
};

const EncounterActions = ({ encounter }) => {
  const params = useParams();

  const RoutedDischargeModal = useMemo(() => getConnectRoutedModal(params, 'discharge'), [params])(
    DischargeModal,
  );

  const RoutedChangeEncounterTypeModal = useMemo(
    () => getConnectRoutedModal(params, 'changeType'),
    [params],
  )(ChangeEncounterTypeModal);

  const RoutedChangeDepartmentModal = useMemo(
    () => getConnectRoutedModal(params, 'changeDepartment'),
    [params],
  )(ChangeDepartmentModal);

  const RoutedMoveModal = useMemo(() => getConnectRoutedModal(params, 'move'), [params])(MoveModal);

  return (
    <>
      <EncounterActionDropdown encounter={encounter} />
      <RoutedDischargeModal encounter={encounter} />
      <RoutedChangeEncounterTypeModal encounter={encounter} />
      <RoutedChangeDepartmentModal />
      <RoutedMoveModal encounter={encounter} />
    </>
  );
};

function getHeaderText({ encounterType }) {
  switch (encounterType) {
    case ENCOUNTER_TYPES.TRIAGE:
      return 'Triage';
    case ENCOUNTER_TYPES.OBSERVATION:
      return 'Active ED patient';
    case ENCOUNTER_TYPES.EMERGENCY:
      return 'Emergency Short Stay';
    case ENCOUNTER_TYPES.ADMISSION:
      return 'Hospital Admission';
    case ENCOUNTER_TYPES.CLINIC:
    case ENCOUNTER_TYPES.IMAGING:
    default:
      return 'Patient Encounter';
  }
}

const GridColumnContainer = styled.div`
  // set min-width to 0 to stop the grid column getting bigger than it's parent
  // as grid column children default to min-width: auto @see https://www.w3.org/TR/css3-grid-layout/#min-size-auto
  min-width: 0;
`;

const StyledTabs = styled(Tabs)`
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  background: white;

  .MuiTabs-root {
    margin-left: -12px;
  }
`;

export const EncounterView = () => {
  const query = useUrlSearchParams();
  const [currentTab, setCurrentTab] = useState(query.get('tab') || ENCOUNTER_TAB_VALUES.VITALS);
  const { getLocalisation } = useLocalisation();
  const patient = useSelector(state => state.patient);
  const { encounter, isLoadingEncounter } = useEncounter();
  const { facility } = useAuth();
  const disabled = encounter?.endDate || patient.death;

  if (!encounter || isLoadingEncounter || patient.loading) return <LoadingIndicator />;

  const visibleTabs = ENCOUNTER_TABS.filter(
    tab => !tab.condition || tab.condition(getLocalisation),
  );

  return (
    <GridColumnContainer>
      <EncounterTopBar
        title={getHeaderText(encounter)}
        subTitle={facility?.name}
        encounter={encounter}
      >
        <EncounterActions encounter={encounter} />
      </EncounterTopBar>
      <ContentPane>
        <EncounterInfoPane encounter={encounter} />
        <Box mt={4} mb={4}>
          <Divider />
        </Box>
        <DiagnosisView
          encounter={encounter}
          isTriage={getIsTriage(encounter)}
          disabled={disabled}
        />
      </ContentPane>
      <ContentPane>
        <StyledTabs tabs={visibleTabs} value={currentTab} onChange={setCurrentTab}>
        <TabContent disabled={disabled} encounter={encounter} value={currentTab} />
          </StyledTabs>
      </ContentPane>
    </GridColumnContainer>
  );
};
