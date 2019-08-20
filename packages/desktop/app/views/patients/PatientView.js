import React from 'react';
import { connect } from 'react-redux';

import TopBar from '../../components/TopBar';

import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
import { PatientHistory } from '../../components/PatientHistory';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { ContentPane } from '../../components/ContentPane';
import { VisitModal } from '../../components/VisitModal';
import { Button } from '../../components/Button';

import { viewVisit } from '../../store/visit';

const HistoryPane = connect(
  state => ({ visits: state.patient.visits, patientId: state.patient._id })
)(React.memo(({ visits, dispatch, patientId }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      {modalOpen && <VisitModal onClose={() => setModalOpen(false)} patientId={patientId} />}
      <ContentPane>
        <Button onClick={() => setModalOpen(true)} variant="contained" color="primary">
          Check in
        </Button>
      </ContentPane>
      <PatientHistory items={visits} onItemClick={item => dispatch(viewVisit(item._id))} />
    </div>
  );
}));

const TABS = [
  {
    label: 'History',
    key: 'history',
    render: () => <HistoryPane />,
  },
  {
    label: 'Details',
    key: 'details',
    render: () => <ContentPane>details</ContentPane>,
  },
  {
    label: 'Appointments',
    key: 'appointments',
    render: () => <ContentPane>appointments</ContentPane>,
  },
  {
    label: 'Documents',
    key: 'documents',
    render: () => <ContentPane>documents</ContentPane>,
  },
];

export const DumbPatientView = React.memo(({ patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('history');
  return (
    <React.Fragment>
      <TopBar title={`${patient.firstName} ${patient.lastName}`} />
      <LoadingIndicator loading={loading}>
        <PatientAlert alerts={patient.alerts} />
        <TwoColumnDisplay>
          <PatientInfoPane patient={patient} />
          <TabDisplay
            tabs={TABS}
            currentTab={currentTab}
            onTabSelect={setCurrentTab}
            patient={patient}
          />
        </TwoColumnDisplay>
      </LoadingIndicator>
    </React.Fragment>
  );
});

export const PatientView = connect(state => ({
  loading: state.patient.loading,
  patient: state.patient,
}))(DumbPatientView);
