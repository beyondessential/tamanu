import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { useParams } from 'react-router-dom';
import { Button, BackButton, TopBar, connectRoutedModal } from '../../components';
import { ContentPane } from '../../components/ContentPane';
import { DiagnosisView } from '../../components/DiagnosisView';
import { DischargeModal } from '../../components/DischargeModal';
import { MoveModal } from '../../components/MoveModal';
import { ChangeEncounterTypeModal } from '../../components/ChangeEncounterTypeModal';
import { ChangeDepartmentModal } from '../../components/ChangeDepartmentModal';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import {
  VitalsPane,
  NotesPane,
  ProcedurePane,
  LabsPane,
  ImagingPane,
  EncounterMedicationPane,
  DocumentsPane,
  ProgramsPane,
  InvoicingPane,
  EncounterInfoPane,
} from './panes';
import { DropdownButton } from '../../components/DropdownButton';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../constants';
import { useEncounter } from '../../contexts/Encounter';
import { useLocalisation } from '../../contexts/Localisation';
import { useAuth } from '../../contexts/Auth';

const getIsTriage = encounter => ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].triageFlowOnly;

const TABS = [
  {
    label: 'Vitals',
    key: 'vitals',
    render: props => <VitalsPane {...props} />,
  },
  {
    label: 'Notes',
    key: 'notes',
    render: props => <NotesPane {...props} />,
  },
  {
    label: 'Procedures',
    key: 'procedures',
    render: props => <ProcedurePane {...props} />,
  },
  {
    label: 'Labs',
    key: 'labs',
    render: props => <LabsPane {...props} />,
  },
  {
    label: 'Imaging',
    key: 'imaging',
    render: props => <ImagingPane {...props} />,
  },
  {
    label: 'Medication',
    key: 'medication',
    render: props => <EncounterMedicationPane {...props} />,
  },
  {
    label: 'Programs',
    key: 'programs',
    render: ({ encounter, ...props }) => (
      <ProgramsPane endpoint={`encounter/${encounter.Id}/programResponses`} {...props} />
    ),
  },
  {
    label: 'Documents',
    key: 'documents',
    render: props => <DocumentsPane {...props} />,
  },
  {
    label: 'Invoicing',
    key: 'invoicing',
    render: props => <InvoicingPane {...props} />,
    condition: getLocalisation => getLocalisation('features.enableInvoicing'),
  },
];

// TODO - WHAT IS Routed modal
const RoutedDischargeModal = connectRoutedModal('/patients/encounter', 'discharge')(DischargeModal);
const RoutedChangeEncounterTypeModal = connectRoutedModal(
  '/patients/encounter',
  'changeType',
)(ChangeEncounterTypeModal);
const RoutedChangeDepartmentModal = connectRoutedModal(
  '/patients/encounter',
  'changeDepartment',
)(ChangeDepartmentModal);
const RoutedMoveModal = connectRoutedModal('/patients/encounter', 'move')(MoveModal);

const EncounterActionDropdown = ({ encounter }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const onChangeEncounterType = type => dispatch(push(`/patients/encounter/changeType/${type}`));
  const onChangeLocation = () => dispatch(push('/patients/encounter/move'));
  const onDischargeOpen = () => dispatch(push('/patients/encounter/discharge'));
  const onChangeDepartment = () => dispatch(push('/patients/encounter/changeDepartment'));
  const onViewSummary = () =>
    dispatch(
      push(`/patients/${params.category}/${encounter.patientId}/encounter/${encounter.id}/summary`),
    );

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

    // Removed as unused seemingly onCancelLocationChange and onFinalizeLocationChange was never passed to component
    // {
    //   label: 'Finalise location change',
    //   condition: () => encounter.plannedLocation,
    //   onClick: onFinaliseLocationChange,
    // },
    // {
    //   label: 'Cancel location change',
    //   condition: () => encounter.plannedLocation,
    //   onClick: () => onCancelLocationChange,
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

const EncounterActions = ({ encounter }) => (
  <>
    <EncounterActionDropdown encounter={encounter} />
    <RoutedDischargeModal encounter={encounter} />
    <RoutedChangeEncounterTypeModal encounter={encounter} />
    <RoutedChangeDepartmentModal encounter={encounter} />
    <RoutedMoveModal encounter={encounter} />
  </>
);

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

export const EncounterView = () => {
  const { getLocalisation } = useLocalisation();
  const params = useParams();
  const patient = useSelector(state => state.patient);
  const { encounter, isLoadingEncounter } = useEncounter();
  const { facility } = useAuth();
  const [currentTab, setCurrentTab] = React.useState('vitals');
  const disabled = encounter?.endDate || patient.death;

  if (!encounter || isLoadingEncounter || patient.loading) return <LoadingIndicator />;

  const visibleTabs = TABS.filter(tab => !tab.condition || tab.condition(getLocalisation));
  return (
    <TwoColumnDisplay>
      <PatientInfoPane patient={patient} disabled={disabled} />
      <GridColumnContainer>
        <TopBar title={getHeaderText(encounter)} subTitle={facility?.name}>
          <EncounterActions encounter={encounter} />
        </TopBar>
        <ContentPane>
          <BackButton to={`/patients/${params.category}/${encounter.patientId}`} />
          <EncounterInfoPane disabled encounter={encounter} />
        </ContentPane>
        <ContentPane>
          <DiagnosisView
            encounter={encounter}
            isTriage={getIsTriage(encounter)}
            disabled={disabled}
          />
        </ContentPane>
        <TabDisplay
          tabs={visibleTabs}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          encounter={encounter}
          disabled={disabled}
        />
      </GridColumnContainer>
    </TwoColumnDisplay>
  );
};
