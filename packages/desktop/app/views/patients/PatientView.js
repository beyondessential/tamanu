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
import { ReferralTable } from '../../components/ReferralTable';
import { AppointmentModal } from '../../components/AppointmentModal';
import { AppointmentTable } from '../../components/AppointmentTable';
import { Button } from '../../components/Button';
import { connectRoutedModal } from '../../components/Modal';

import { viewVisit } from '../../store/visit';

import { getCurrentRouteEndsWith } from '../../store/router';
import { getCurrentVisit } from '../../store/patient';

const AppointmentPane = React.memo(({ patient }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <AppointmentModal
        open={modalOpen}
        patientId={patient._id}
        onClose={() => setModalOpen(false)}
      />
      <AppointmentTable appointments={patient.appointments} />
      <ContentPane>
        <Button onClick={() => setModalOpen(true)} variant="contained" color="primary">
          New appointment
        </Button>
      </ContentPane>
    </div>
  );
});

const ReferralPane = React.memo(({ patient }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <ReferralModal open={modalOpen} patientId={patient._id} onClose={() => setModalOpen(false)} />
      <ReferralTable referrals={patient.referrals} />
      <ContentPane>
        <Button onClick={() => setModalOpen(true)} variant="contained" color="primary">
          New referral
        </Button>
      </ContentPane>
    </div>
  );
});

const RoutedVisitModal = connectRoutedModal('/patients/view', 'checkin')(({
  isModalOpen, onModalClose, patientId,
}) => <VisitModal open={isModalOpen} onClose={onModalClose} patientId={patientId} />);

const HistoryPane = connect(
  state => ({
    visits: state.patient.visits,
    patientId: state.patient._id,
    isCheckInAvailable: !getCurrentVisit(state),
  }),
  dispatch => ({
    onViewVisit: id => dispatch(viewVisit(id)),
    onModalOpen: () => dispatch(push('/patients/view/checkin')),
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
  },
  {
    label: 'Appointments',
    key: 'appointments',
    render: ({ patient }) => <AppointmentPane patient={patient} />,
  },
  {
    label: 'Referrals',
    key: 'Referrals',
    render: ({ patient }) => <ReferralPane patient={patient} />,
  },
  {
    label: 'Documents',
    key: 'documents',
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
      <RoutedVisitModal patientId={patient._id} />
    </React.Fragment>
  );
});

export const PatientView = connect(state => ({
  loading: state.patient.loading,
  patient: state.patient,
}))(DumbPatientView);
