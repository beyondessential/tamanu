import React, { useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { Button, BackButton } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { DiagnosisView } from '../../components/DiagnosisView';
import { DischargeModal } from '../../components/DischargeModal';
import { MoveModal } from '../../components/MoveModal';
import { ChangeEncounterTypeModal } from '../../components/ChangeEncounterTypeModal';
import { ChangeDepartmentModal } from '../../components/ChangeDepartmentModal';
import { LabRequestModal } from '../../components/LabRequestModal';
import { LabRequestsTable } from '../../components/LabRequestsTable';
import { DataFetchingProgramsTable } from '../../components/ProgramResponsesTable';
import { ImagingRequestModal } from '../../components/ImagingRequestModal';
import { ImagingRequestsTable } from '../../components/ImagingRequestsTable';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { VitalsModal } from '../../components/VitalsModal';
import { MedicationModal } from '../../components/MedicationModal';
import { EncounterMedicationTable } from '../../components/MedicationTable';
import { ProcedureModal } from '../../components/ProcedureModal';
import { ProcedureTable } from '../../components/ProcedureTable';
import { VitalsTable } from '../../components/VitalsTable';
import { connectRoutedModal } from '../../components/Modal';
import { NoteModal } from '../../components/NoteModal';
import { NoteTable } from '../../components/NoteTable';
import { TopBar, SuggesterSelectField } from '../../components';
import { DocumentsPane, InvoicingPane } from './panes';
import { DropdownButton } from '../../components/DropdownButton';
import { FormGrid } from '../../components/FormGrid';
import { SelectInput, DateInput, TextInput } from '../../components/Field';
import { encounterOptions, ENCOUNTER_OPTIONS_BY_VALUE } from '../../constants';
import { useEncounter } from '../../contexts/Encounter';
import { useLocalisation } from '../../contexts/Localisation';
import { useAuth } from '../../contexts/Auth';

const getIsTriage = encounter => ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].triageFlowOnly;

const VitalsPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  return (
    <div>
      <VitalsModal
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <VitalsTable />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          Record vitals
        </Button>
      </ContentPane>
    </div>
  );
});

const NotesPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  return (
    <div>
      <NoteModal
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <NoteTable encounterId={encounter.id} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New note
        </Button>
      </ContentPane>
    </div>
  );
});

const ProcedurePane = React.memo(({ encounter, readonly }) => {
  const [editedProcedure, setEditedProcedure] = useState(null);
  const { loadEncounter } = useEncounter();

  return (
    <div>
      <ProcedureModal
        editedProcedure={editedProcedure}
        encounterId={encounter.id}
        onClose={() => setEditedProcedure(null)}
        onSaved={async () => {
          setEditedProcedure(null);
          await loadEncounter(encounter.id);
        }}
      />
      <ProcedureTable encounterId={encounter.id} onItemClick={item => setEditedProcedure(item)} />
      <ContentPane>
        <Button
          onClick={() => setEditedProcedure({})}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New procedure
        </Button>
      </ContentPane>
    </div>
  );
});

const LabsPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <LabRequestModal open={modalOpen} encounter={encounter} onClose={() => setModalOpen(false)} />
      <LabRequestsTable encounterId={encounter.id} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New lab request
        </Button>
      </ContentPane>
    </div>
  );
});

const ImagingPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <ImagingRequestModal
        open={modalOpen}
        encounter={encounter}
        onClose={() => setModalOpen(false)}
      />
      <ImagingRequestsTable encounterId={encounter.id} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New imaging request
        </Button>
      </ContentPane>
    </div>
  );
});

const MedicationPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  return (
    <div>
      <MedicationModal
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <EncounterMedicationTable encounterId={encounter.id} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New prescription
        </Button>
      </ContentPane>
    </div>
  );
});

const ProgramsPane = connect(null, dispatch => ({
  onNavigateToPrograms: () => dispatch(push('/programs')),
}))(
  React.memo(({ onNavigateToPrograms, encounter }) => (
    <div>
      <DataFetchingProgramsTable encounterId={encounter.id} />
      <ContentPane>
        <Button onClick={onNavigateToPrograms} variant="contained" color="primary">
          New survey
        </Button>
      </ContentPane>
    </div>
  )),
);

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
    render: props => <MedicationPane {...props} />,
  },
  {
    label: 'Programs',
    key: 'programs',
    render: props => <ProgramsPane {...props} />,
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

const getDepartmentName = ({ department }) => (department ? department.name : 'Unknown');
const getLocationName = ({ location }) => (location ? location.name : 'Unknown');
const getExaminerName = ({ examiner }) => (examiner ? examiner.displayName : 'Unknown');

const EncounterInfoPane = React.memo(({ disabled, encounter }) => (
  <FormGrid columns={3}>
    <DateInput disabled={disabled} value={encounter.startDate} label="Arrival date" />
    <DateInput disabled={disabled} value={encounter.endDate} label="Discharge date" />
    <SuggesterSelectField
      disabled
      label="Patient type"
      field={{ name: 'patientBillingTypeId', value: encounter.patientBillingTypeId }}
      endpoint="patientBillingType"
    />
    <TextInput disabled={disabled} value={getDepartmentName(encounter)} label="Department" />
    <SelectInput
      disabled={disabled}
      value={encounter.encounterType}
      label="Encounter type"
      options={encounterOptions}
    />
    <TextInput disabled={disabled} value={getExaminerName(encounter)} label="Doctor/Nurse" />
    <TextInput disabled={disabled} value={getLocationName(encounter)} label="Location" />
    {encounter.plannedLocation && (
      <TextInput
        disabled={disabled}
        value={encounter.plannedLocation.name}
        label="Planned location"
      />
    )}
    <TextInput
      disabled={disabled}
      value={encounter.reasonForEncounter}
      label="Reason for encounter"
      style={{ gridColumn: 'span 2' }}
    />
  </FormGrid>
));

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

const EncounterActionDropdown = connect(null, dispatch => ({
  onDischargeOpen: () => dispatch(push('/patients/encounter/discharge')),
  onChangeEncounterType: newType => dispatch(push(`/patients/encounter/changeType/${newType}`)),
  onViewSummary: () => dispatch(push('/patients/encounter/summary')),
  onChangeLocation: () => dispatch(push('/patients/encounter/move')),
  onChangeDepartment: () => dispatch(push('/patients/encounter/changeDepartment')),
}))(
  ({
    encounter,
    onDischargeOpen,
    onChangeEncounterType,
    onChangeLocation,
    onCancelLocationChange,
    onFinaliseLocationChange,
    onChangeDepartment,
    onViewSummary,
  }) => {
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
      {
        label: 'Finalise location change',
        condition: () => encounter.plannedLocation,
        onClick: onFinaliseLocationChange,
      },
      {
        label: 'Cancel location change',
        condition: () => encounter.plannedLocation,
        onClick: onCancelLocationChange,
      },
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
  },
);

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
          <BackButton to="/patients/view" />
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
