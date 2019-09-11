import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';

import { Button } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { DiagnosisView } from '../../components/DiagnosisView';
import { DischargeModal } from '../../components/DischargeModal';
import { LabRequestModal } from '../../components/LabRequestModal';
import { LabRequestsTable } from '../../components/LabRequestsTable';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { VitalsModal } from '../../components/VitalsModal';
import { VitalsTable } from '../../components/VitalsTable';

import { FormGrid } from '../../components/FormGrid';
import { SelectInput, DateInput, TextInput } from '../../components/Field';
import { visitOptions } from '../../constants';

import { getCurrentRouteEndsWith } from '../../store/router';

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

const TABS = [
  {
    label: 'Vitals',
    key: 'vitals',
    render: ({ visit }) => <VitalsPane visit={visit} />,
  },
  {
    label: 'Notes',
    key: 'notes',
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
    label: 'Documents',
    key: 'documents',
    render: () => <ContentPane>Documents</ContentPane>,
  },
];

const BackLink = connect(
  null,
  dispatch => ({ onClick: () => dispatch(push('/patients/view')) }),
)(({ onClick }) => <Button onClick={onClick}>&lt; Back to patient information</Button>);

const getLocationName = ({ location }) => location ? location.name : "Unknown";
const getExaminerName = ({ examiner }) => examiner ? examiner.displayName : "Unknown";

const VisitInfoPane = React.memo(({ visit }) => (
  <FormGrid columns={3}>
    <DateInput value={visit.startDate} label="Admission date" />
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

const DischargeView = connect(
  state => ({
    modalOpen: getCurrentRouteEndsWith(state, 'discharge'),
  }),
  dispatch => ({
    onModalOpen: () => dispatch(push('/patients/visit/discharge')),
    onModalClose: () => dispatch(push('/patients/visit')),
  }),
)(({ modalOpen, onModalOpen, onModalClose, visit }) => (
  <React.Fragment>
    <Button onClick={onModalOpen} disabled={!!visit.endDate}>
      Discharge patient
    </Button>
    <DischargeModal open={modalOpen} onClose={onModalClose} visit={visit} />
  </React.Fragment>
));

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const DumbVisitView = React.memo(({ visit, patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('vitals');

  return (
    <LoadingIndicator loading={loading}>
      <TwoColumnDisplay>
        <PatientInfoPane patient={patient} />
        <div>
          <Header>
            <BackLink />
            <DischargeView visit={visit} />
          </Header>
          <ContentPane>
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
