import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
import { PatientHistory } from '../../components/PatientHistory';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { ContentPane } from '../../components/ContentPane';
import { VisitModal } from '../../components/VisitModal';
import { ReferralModal } from '../../components/ReferralModal';
import { Button } from '../../components/Button';

import { viewVisit } from '../../store/visit';

import { getCurrentRouteEndsWith } from '../../store/router';
import { getCurrentVisit } from '../../store/patient';

const ReferralTable = () => <div>referral table</div>;

const ReferralPane = React.memo(({ patient }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <ReferralModal open={modalOpen} patientId={patient._id} onClose={() => setModalOpen(false)} />
      <ReferralTable />
      <ContentPane>
        <Button onClick={() => setModalOpen(true)} variant="contained" color="primary">
          New referral
        </Button>
      </ContentPane>
    </div>
  );
});

const HistoryPane = connect(
  state => ({
    visits: state.patient.visits,
    patientId: state.patient._id,
    isModalOpen: getCurrentRouteEndsWith(state, 'checkin'),
    isCheckInAvailable: !getCurrentVisit(state),
  }),
  dispatch => ({
    onViewVisit: id => dispatch(viewVisit(id)),
    onModalOpen: () => dispatch(push('/patients/view/checkin')),
    onModalClose: () => dispatch(push('/patients/view')),
  }),
)(
  React.memo(
    ({
      visits,
      patientId,
      isModalOpen,
      onModalClose,
      onModalOpen,
      onViewVisit,
      isCheckInAvailable,
    }) => (
      <div>
        <VisitModal open={isModalOpen} onClose={onModalClose} patientId={patientId} />
        <ContentPane>
          <Button
            disabled={!isCheckInAvailable}
            onClick={onModalOpen}
            variant="contained"
            color="primary"
          >
            Check in
          </Button>
        </ContentPane>
        <PatientHistory items={visits} onItemClick={item => onViewVisit(item._id)} />
      </div>
    ),
  ),
);

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
    label: 'Referrals',
    key: 'Referrals',
    render: ({ patient }) => <ReferralPane patient={patient} />,
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
