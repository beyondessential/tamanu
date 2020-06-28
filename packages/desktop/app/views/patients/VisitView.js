import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import SubjectIcon from '@material-ui/icons/Subject';

import { VISIT_TYPES } from 'shared/constants';
import { Button, BackButton } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { DiagnosisView } from '../../components/DiagnosisView';
import { DischargeModal } from '../../components/DischargeModal';
import { BeginMoveModal, FinaliseMoveModal, CancelMoveModal } from '../../components/MoveModal';
import { ChangeTypeModal } from '../../components/ChangeTypeModal';
import { ChangeDepartmentModal } from '../../components/ChangeDepartmentModal';
import { LabRequestModal } from '../../components/LabRequestModal';
import { LabRequestsTable } from '../../components/LabRequestsTable';
import { SurveyResponsesTable } from '../../components/SurveyResponsesTable';
import { ImagingRequestModal } from '../../components/ImagingRequestModal';
import { ImagingRequestsTable } from '../../components/ImagingRequestsTable';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { VitalsModal } from '../../components/VitalsModal';
import { MedicationModal } from '../../components/MedicationModal';
import { VisitMedicationTable } from '../../components/MedicationTable';
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
import { visitOptions, VISIT_OPTIONS_BY_VALUE, Colors } from '../../constants';

const getIsTriage = visit => VISIT_OPTIONS_BY_VALUE[visit.visitType].triageFlowOnly;

const VitalsPane = React.memo(({ visit, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      {modalOpen && <VitalsModal visitId={visit.id} onClose={() => setModalOpen(false)} />}
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

const NotesPane = React.memo(({ visit, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <NoteModal open={modalOpen} visitId={visit.id} onClose={() => setModalOpen(false)} />
      <NoteTable visitId={visit.id} />
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

const LabsPane = React.memo(({ visit, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <LabRequestModal open={modalOpen} visit={visit} onClose={() => setModalOpen(false)} />
      <LabRequestsTable labs={visit.labRequests} />
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

const ImagingPane = React.memo(({ visit, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <ImagingRequestModal open={modalOpen} visit={visit} onClose={() => setModalOpen(false)} />
      <ImagingRequestsTable imagingRequests={visit.imagingRequests} />
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

const MedicationPane = React.memo(({ visit, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <MedicationModal open={modalOpen} visitId={visit.id} onClose={() => setModalOpen(false)} />
      <VisitMedicationTable visitId={visit.id} />
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

const ProcedurePane = React.memo(({ visit, readonly }) => {
  const [editedProcedure, setEditedProcedure] = React.useState(null);

  return (
    <div>
      <ProcedureModal
        editedProcedure={editedProcedure}
        visitId={visit.id}
        onClose={() => setEditedProcedure(null)}
      />
      <ProcedureTable visitId={visit.id} onItemClick={item => setEditedProcedure(item)} />
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
  React.memo(({ onNavigateToPrograms, visit }) => (
    <div>
      <SurveyResponsesTable surveyResponses={visit.surveyResponses} />
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

const VisitInfoPane = React.memo(({ visit }) => (
  <FormGrid columns={3}>
    <DateInput value={visit.startDate} label="Arrival date" />
    <DateInput value={visit.endDate} label="Discharge date" />
    <TextInput value={getDepartmentName(visit)} label="Department" />
    <TextInput value={getLocationName(visit)} label="Location" />
    <SelectInput value={visit.visitType} label="Visit type" options={visitOptions} />
    <TextInput value={getExaminerName(visit)} label="Doctor/nurse" />
    {visit.plannedLocation && (
      <TextInput value={visit.plannedLocation.name} label="Planned location" />
    )}
    <TextInput
      value={visit.reasonForVisit}
      label="Reason for visit"
      style={{ gridColumn: 'span 3' }}
    />
  </FormGrid>
));

const RoutedDischargeModal = connectRoutedModal('/patients/visit', 'discharge')(DischargeModal);
const RoutedChangeTypeModal = connectRoutedModal('/patients/visit', 'changeType')(ChangeTypeModal);
const RoutedChangeDepartmentModal = connectRoutedModal(
  '/patients/visit',
  'changeDepartment',
)(ChangeDepartmentModal);
const RoutedBeginMoveModal = connectRoutedModal('/patients/visit', 'beginMove')(BeginMoveModal);
const RoutedCancelMoveModal = connectRoutedModal('/patients/visit', 'cancelMove')(CancelMoveModal);
const RoutedFinaliseMoveModal = connectRoutedModal(
  '/patients/visit',
  'finaliseMove',
)(FinaliseMoveModal);

const VisitActionDropdown = connect(null, dispatch => ({
  onDischargeOpen: () => dispatch(push('/patients/visit/discharge')),
  onChangeVisitType: newType => dispatch(push(`/patients/visit/changeType/${newType}`)),
  onViewSummary: () => dispatch(push('/patients/visit/summary')),
  onChangeLocation: () => dispatch(push('/patients/visit/beginMove')),
  onCancelLocationChange: () => dispatch(push('/patients/visit/cancelMove')),
  onFinaliseLocationChange: () => dispatch(push('/patients/visit/finaliseMove')),
  onChangeDepartment: () => dispatch(push('/patients/visit/changeDepartment')),
}))(
  ({
    visit,
    onDischargeOpen,
    onChangeVisitType,
    onChangeLocation,
    onCancelLocationChange,
    onFinaliseLocationChange,
    onChangeDepartment,
    onViewSummary,
  }) => {
    if (visit.endDate) {
      return (
        <Button variant="outlined" color="primary" onClick={onViewSummary}>
          View discharge summary
        </Button>
      );
    }

    const progression = {
      [VISIT_TYPES.TRIAGE]: 0,
      [VISIT_TYPES.OBSERVATION]: 1,
      [VISIT_TYPES.EMERGENCY]: 2,
      [VISIT_TYPES.ADMISSION]: 3,
    };
    const isProgressionForward = (currentState, nextState) =>
      progression[nextState] > progression[currentState];
    const actions = [
      {
        label: 'Move to active ED care',
        onClick: () => onChangeVisitType(VISIT_TYPES.OBSERVATION),
        condition: () => isProgressionForward(visit.visitType, VISIT_TYPES.OBSERVATION),
      },
      {
        label: 'Move to emergency short stay',
        onClick: () => onChangeVisitType(VISIT_TYPES.EMERGENCY),
        condition: () => isProgressionForward(visit.visitType, VISIT_TYPES.EMERGENCY),
      },
      {
        label: 'Admit to hospital',
        onClick: () => onChangeVisitType(VISIT_TYPES.ADMISSION),
        condition: () => isProgressionForward(visit.visitType, VISIT_TYPES.ADMISSION),
      },
      {
        label: 'Finalise location change',
        condition: () => visit.plannedLocation,
        onClick: onFinaliseLocationChange,
      },
      {
        label: 'Cancel location change',
        condition: () => visit.plannedLocation,
        onClick: onCancelLocationChange,
      },
      {
        label: 'Discharge without being seen',
        onClick: onDischargeOpen,
        condition: () => visit.visitType === VISIT_TYPES.TRIAGE,
      },
      {
        label: 'Discharge',
        onClick: onDischargeOpen,
        condition: () => visit.visitType !== VISIT_TYPES.TRIAGE,
      },
      {
        label: 'Change department',
        onClick: onChangeDepartment,
      },
      {
        label: 'Change location',
        condition: () => !visit.plannedLocation,
        onClick: onChangeLocation,
      },
    ].filter(action => !action.condition || action.condition());

    return <DropdownButton variant="outlined" actions={actions} />;
  },
);

const VisitActions = ({ visit }) => (
  <React.Fragment>
    <VisitActionDropdown visit={visit} />
    <RoutedDischargeModal visit={visit} />
    <RoutedChangeTypeModal visit={visit} />
    <RoutedChangeDepartmentModal visit={visit} />
    <RoutedBeginMoveModal visit={visit} />
    <RoutedCancelMoveModal visit={visit} />
    <RoutedFinaliseMoveModal visit={visit} />
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

function getHeaderText({ visitType }) {
  switch (visitType) {
    case VISIT_TYPES.TRIAGE:
      return 'Triage';
    case VISIT_TYPES.OBSERVATION:
      return 'Active ED patient';
    case VISIT_TYPES.EMERGENCY:
      return 'Emergency short stay';
    case VISIT_TYPES.ADMISSION:
      return 'Hospital admission';
    case VISIT_TYPES.CLINIC:
    case VISIT_TYPES.IMAGING:
    default:
      return 'Patient visit';
  }
}

export const DumbVisitView = React.memo(({ visit, patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('vitals');
  const readonly = visit.endDate || patient.death;

  if (loading) return <LoadingIndicator />;

  return (
    <TwoColumnDisplay>
      <PatientInfoPane patient={patient} readonly={readonly} />
      <div>
        <TopBar title={getHeaderText(visit)}>
          <VisitActions visit={visit} />
          <AdmissionInfoRow>
            <AdmissionInfo>
              <SubjectIcon />
              <AdmissionInfoLabel>Type: </AdmissionInfoLabel>
              <span>{` ${visit.visitType}`}</span>
            </AdmissionInfo>
            <AdmissionInfo>
              <CalendarIcon />
              <AdmissionInfoLabel>Arrival: </AdmissionInfoLabel>
              <DateDisplay date={visit.startDate} />
            </AdmissionInfo>
          </AdmissionInfoRow>
        </TopBar>
        <ContentPane>
          <BackButton to="/patients/view" />
          <VisitInfoPane visit={visit} />
        </ContentPane>
        <ContentPane>
          <DiagnosisView visitId={visit.id} isTriage={getIsTriage(visit)} readonly={readonly} />
        </ContentPane>
        <TabDisplay
          tabs={TABS}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          visit={visit}
          readonly={readonly}
        />
      </div>
    </TwoColumnDisplay>
  );
});

export const VisitView = connect(state => ({
  loading: state.visit.loading,
  visit: state.visit,
  patient: state.patient,
}))(DumbVisitView);
