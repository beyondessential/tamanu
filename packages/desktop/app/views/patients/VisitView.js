import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import SubjectIcon from '@material-ui/icons/Subject';

import { Button, BackButton } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { DiagnosisView } from '../../components/DiagnosisView';
import { DischargeModal } from '../../components/DischargeModal';
import { ChangeTypeModal } from '../../components/ChangeTypeModal';
import { LabRequestModal } from '../../components/LabRequestModal';
import { LabRequestsTable } from '../../components/LabRequestsTable';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { VitalsModal } from '../../components/VitalsModal';
import { MedicationModal } from '../../components/MedicationModal';
import { MedicationTable } from '../../components/MedicationTable';
import { VitalsTable } from '../../components/VitalsTable';
import { connectRoutedModal } from '../../components/Modal';
import { NoteModal } from '../../components/NoteModal';
import { NoteTable } from '../../components/NoteTable';
import { TopBar, DateDisplay } from '../../components';

import { DropdownButton } from '../../components/DropdownButton';

import { FormGrid } from '../../components/FormGrid';
import { SelectInput, DateInput, TextInput } from '../../components/Field';
import { visitOptions, Colors } from '../../constants';

const VitalsPane = React.memo(({ visit }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      {modalOpen && <VitalsModal visitId={visit._id} onClose={() => setModalOpen(false)} />}
      <VitalsTable />
      <ContentPane>
        <Button onClick={() => setModalOpen(true)} variant="contained" color="primary">
          Record vitals
        </Button>
      </ContentPane>
    </div>
  );
});

const NotesPane = React.memo(({ visit }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <NoteModal open={modalOpen} visitId={visit._id} onClose={() => setModalOpen(false)} />
      <NoteTable notes={visit.notes} />
      <ContentPane>
        <Button onClick={() => setModalOpen(true)} variant="contained" color="primary">
          New note
        </Button>
      </ContentPane>
    </div>
  );
});

const LabsPane = React.memo(({ visit }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <LabRequestModal open={modalOpen} visit={visit} onClose={() => setModalOpen(false)} />
      <LabRequestsTable labs={visit.labRequests} />
      <ContentPane>
        <Button onClick={() => setModalOpen(true)} variant="contained" color="primary">
          New lab request
        </Button>
      </ContentPane>
    </div>
  );
});

const MedicationPane = React.memo(({ visit }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <MedicationModal open={modalOpen} visitId={visit.id} onClose={() => setModalOpen(false)} />
      <MedicationTable medications={visit.medications} />
      <ContentPane>
        <Button onClick={() => setModalOpen(true)} variant="contained" color="primary">
          New prescription
        </Button>
      </ContentPane>
    </div>
  );
});

const TABS = [
  {
    label: 'Vitals',
    key: 'vitals',
    render: ({ visit }) => <VitalsPane visit={visit} />,
  },
  {
    label: 'Notes',
    key: 'notes',
    render: ({ visit }) => <NotesPane visit={visit} />,
  },
  {
    label: 'Procedures',
    key: 'procedures',
  },
  {
    label: 'Labs',
    key: 'labs',
    render: ({ visit }) => <LabsPane visit={visit} />,
  },
  {
    label: 'Medication',
    key: 'medication',
    render: ({ visit }) => <MedicationPane visit={visit} />,
  },
  {
    label: 'Documents',
    key: 'documents',
  },
];

const getLocationName = ({ location }) => (location ? location.name : 'Unknown');
const getExaminerName = ({ examiner }) => (examiner ? examiner.displayName : 'Unknown');

const VisitInfoPane = React.memo(({ visit }) => (
  <FormGrid columns={3}>
    <DateInput value={visit.startDate} label="Arrival date" />
    <DateInput value={visit.endDate} label="Discharge date" />
    <TextInput value={getLocationName(visit)} label="Location" />
    <SelectInput value={visit.visitType} label="Visit type" options={visitOptions} />
    <TextInput value={getExaminerName(visit)} label="Doctor/nurse" />
    <TextInput
      value={visit.reasonForVisit}
      label="Reason for visit"
      style={{ gridColumn: 'span 3' }}
    />
  </FormGrid>
));

const RoutedDischargeModal = connectRoutedModal('/patients/visit', 'discharge')(DischargeModal);
const RoutedChangeTypeModal = connectRoutedModal('/patients/visit', 'changeType')(ChangeTypeModal);

const VisitActionDropdown = connect(
  null,
  dispatch => ({
    onDischargeOpen: () => dispatch(push('/patients/visit/discharge')),
    onChangeVisitType: newType => dispatch(push(`/patients/visit/changeType/${newType}`)),
    onViewSummary: () => dispatch(push('/patients/visit/summary')),
  }),
)(({ visit, onDischargeOpen, onChangeVisitType, onViewSummary }) => {

  if (visit.endDate) {
    return (
      <Button variant="outlined" color="primary" onClick={onViewSummary}>
        View discharge summary
      </Button>
    );
  }

  const progression = {
    triage: 0,
    observation: 1,
    emergency: 2,
    admission: 3,
  };
  const isProgressionForward = (currentState, nextState) =>
    progression[nextState] > progression[currentState];
  const actions = [
    {
      label: 'Place under observation',
      onClick: () => onChangeVisitType('observation'),
      condition: () => isProgressionForward(visit.visitType, 'observation'),
    },
    {
      label: 'Admit to emergency',
      onClick: () => onChangeVisitType('emergency'),
      condition: () => isProgressionForward(visit.visitType, 'emergency'),
    },
    {
      label: 'Admit to hospital',
      onClick: () => onChangeVisitType('admission'),
      condition: () => isProgressionForward(visit.visitType, 'admission'),
    },
    {
      label: 'Discharge',
      onClick: onDischargeOpen,
    },
  ].filter(action => !action.condition || action.condition());

  return <DropdownButton variant="outlined" actions={actions} />;
});

const DischargeView = ({ visit }) => {
  return (
    <React.Fragment>
      <VisitActionDropdown visit={visit} />
      <RoutedDischargeModal visit={visit} />
      <RoutedChangeTypeModal visit={visit} />
    </React.Fragment>
  );
};

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
    case 'triage':
      return 'Triaged patient';
    case 'emergency':
      return 'Emergency admission';
    case 'observation':
      return 'Patient under observation';
    case 'admission':
      return 'Hospital admission';
    case 'clinic':
    case 'lab':
    case 'imaging':
    default:
      return 'Patient visit';
  }
}

export const DumbVisitView = React.memo(({ visit, patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('vitals');

  return (
    <LoadingIndicator loading={loading}>
      <TwoColumnDisplay>
        <PatientInfoPane patient={patient} />
        <div>
          <TopBar title={getHeaderText(visit)}>
            <DischargeView visit={visit} />
            <AdmissionInfoRow>
              <AdmissionInfo>
                <SubjectIcon />
                <AdmissionInfoLabel>Type: </AdmissionInfoLabel> {visit.visitType}
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
            <DiagnosisView visitId={visit._id} />
          </ContentPane>
          <TabDisplay
            tabs={TABS}
            currentTab={currentTab}
            onTabSelect={setCurrentTab}
            visit={visit}
          />
        </div>
      </TwoColumnDisplay>
    </LoadingIndicator>
  );
});

export const VisitView = connect(state => ({
  loading: state.visit.loading,
  visit: state.visit,
  patient: state.patient,
}))(DumbVisitView);
