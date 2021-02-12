import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import SubjectIcon from '@material-ui/icons/Subject';

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
import { DataFetchingSurveyResponsesTable } from '../../components/SurveyResponsesTable';
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
import { TopBar, DateDisplay } from '../../components';

import { DropdownButton } from '../../components/DropdownButton';

import { FormGrid } from '../../components/FormGrid';
import { SelectInput, DateInput, TextInput } from '../../components/Field';
import { encounterOptions, ENCOUNTER_OPTIONS_BY_VALUE, Colors } from '../../constants';
import { useEncounter } from '../../contexts/Encounter';

const getIsTriage = encounter => encounter.type && ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].triageFlowOnly;

const VitalsPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      {modalOpen && <VitalsModal encounterId={encounter.id} onClose={() => setModalOpen(false)} />}
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
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <NoteModal open={modalOpen} encounterId={encounter.id} onClose={() => setModalOpen(false)} />
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

const LabsPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

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
  const [modalOpen, setModalOpen] = React.useState(false);

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
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <MedicationModal
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
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

const ProcedurePane = React.memo(({ encounter, readonly }) => {
  const [editedProcedure, setEditedProcedure] = React.useState(null);

  return (
    <div>
      <ProcedureModal
        editedProcedure={editedProcedure}
        encounterId={encounter.id}
        onClose={() => setEditedProcedure(null)}
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

const ProgramsPane = connect(null, dispatch => ({
  onNavigateToPrograms: () => dispatch(push('/programs')),
}))(
  React.memo(({ onNavigateToPrograms, encounter }) => (
    <div>
      <DataFetchingSurveyResponsesTable encounterId={encounter.id} />
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
  },
];

const getDepartmentName = ({ department }) => (department ? department.name : 'Unknown');
const getLocationName = ({ location }) => (location ? location.name : 'Unknown');
const getExaminerName = ({ examiner }) => (examiner ? examiner.displayName : 'Unknown');

const EncounterInfoPane = React.memo(({ disabled, encounter }) => {
  return (
    <FormGrid columns={3}>
      <DateInput disabled={disabled} value={encounter.startDate} label="Arrival date" />
      <DateInput disabled={disabled} value={encounter.endDate} label="Discharge date" />
      <TextInput disabled={disabled} value={getDepartmentName(encounter)} label="Department" />
      <TextInput disabled={disabled} value={getLocationName(encounter)} label="Location" />
      <SelectInput
        disabled={disabled}
        value={encounter.encounterType}
        label="Encounter type"
        options={encounterOptions}
      />
      <TextInput disabled={disabled} value={getExaminerName(encounter)} label="Doctor/nurse" />
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
        style={{ gridColumn: 'span 3' }}
      />
    </FormGrid>
  );
});

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
  <React.Fragment>
    <EncounterActionDropdown encounter={encounter} />
    <RoutedDischargeModal encounter={encounter} />
    <RoutedChangeEncounterTypeModal encounter={encounter} />
    <RoutedChangeDepartmentModal encounter={encounter} />
    <RoutedMoveModal encounter={encounter} />
  </React.Fragment>
);

const AdmissionInfoRow = styled.div`
  display: flex;
  font-size: 14px;
  text-transform: capitalize;
  color: ${Colors.midText};

  span:first-child {
    margin-right: 10px;
  }
`;

const AdmissionInfoLabel = styled.span`
  color: ${Colors.darkText};
  font-weight: 500;
`;

const AdmissionInfo = styled.span`
  svg {
    vertical-align: sub;
    width: 16px;
    height: 16px;
    color: ${Colors.outline};
    margin-right: 3px;
  }
`;

function getHeaderText({ encounterType }) {
  switch (encounterType) {
    case ENCOUNTER_TYPES.TRIAGE:
      return 'Triage';
    case ENCOUNTER_TYPES.OBSERVATION:
      return 'Active ED patient';
    case ENCOUNTER_TYPES.EMERGENCY:
      return 'Emergency short stay';
    case ENCOUNTER_TYPES.ADMISSION:
      return 'Hospital admission';
    case ENCOUNTER_TYPES.CLINIC:
    case ENCOUNTER_TYPES.IMAGING:
    default:
      return 'Patient encounter';
  }
}

export const DumbEncounterView = ({ patient, encounter }) => {
  const [currentTab, setCurrentTab] = React.useState('vitals');
  const disabled = encounter.endDate || patient.death;

  return (
    <TwoColumnDisplay>
      <PatientInfoPane patient={patient} disabled={disabled} />
      <div>
        <TopBar title={getHeaderText(encounter)}>
          <EncounterActions encounter={encounter} />
          <AdmissionInfoRow>
            <AdmissionInfo>
              <SubjectIcon />
              <AdmissionInfoLabel>Type: </AdmissionInfoLabel>
              <span>{`${encounter.encounterType}`}</span>
            </AdmissionInfo>
            <AdmissionInfo>
              <CalendarIcon />
              <AdmissionInfoLabel>Arrival: </AdmissionInfoLabel>
              <DateDisplay date={encounter.startDate} />
            </AdmissionInfo>
          </AdmissionInfoRow>
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
          tabs={TABS}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          encounter={encounter}
          disabled={disabled}
        />
      </div>
    </TwoColumnDisplay>
  );
};

export const EncounterView = connect(state => ({
  patient: state.patient,
}))(({ patient }) => {
  const { encounter, isLoadingEncounter } = useEncounter();

  if (!encounter || isLoadingEncounter) return <LoadingIndicator />;

  return <DumbEncounterView encounter={encounter} patient={patient} />;
});
