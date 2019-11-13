import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { connectApi } from '../../api';

import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
import { PatientHistory } from '../../components/PatientHistory';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { ContentPane } from '../../components/ContentPane';
import { VisitModal } from '../../components/VisitModal';
import { TriageModal } from '../../components/TriageModal';
import { ReferralModal } from '../../components/ReferralModal';
import { ReferralTable } from '../../components/ReferralTable';
import { AppointmentModal } from '../../components/AppointmentModal';
import { AppointmentTable } from '../../components/AppointmentTable';
import { Button } from '../../components/Button';
import { connectRoutedModal } from '../../components/Modal';
import { PatientVisitSummary } from './components/PatientVisitSummary';

import { PatientDetailsForm } from '../../forms/PatientDetailsForm';

import { viewVisit } from '../../store/visit';
import { reloadPatient } from '../../store/patient';

import { PatientStickerLabelPage } from '../../components/PatientStickerLabel';

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

const RoutedVisitModal = connectRoutedModal('/patients/view', 'checkin')(VisitModal);
const RoutedTriageModal = connectRoutedModal('/patients/view', 'triage')(TriageModal);

const HistoryPane = connect(
  state => ({
    visits: state.patient.visits,
  }),
  dispatch => ({
    onViewVisit: id => dispatch(viewVisit(id)),
    onOpenCheckin: () => dispatch(push('/patients/view/checkin')),
    onOpenTriage: () => dispatch(push('/patients/view/triage')),
  }),
)(
  React.memo(({ visits, onViewVisit, onOpenCheckin, onOpenTriage }) => (
    <div>
      <PatientVisitSummary
        visits={visits}
        viewVisit={onViewVisit}
        openCheckin={onOpenCheckin}
        openTriage={onOpenTriage}
      />
      <PatientHistory items={visits} onItemClick={item => onViewVisit(item._id)} />
    </div>
  )),
);

const ConnectedPatientDetailsForm = connectApi((api, dispatch, { patient }) => ({
  onSubmit: async data => {
    await api.put(`patient/${patient._id}`, data);
    dispatch(reloadPatient(patient._id));
  },
}))(
  React.memo(props => (
    <ContentPane>
      <PatientDetailsForm {...props} />
    </ContentPane>
  )),
);

const TABS = [
  {
    label: 'History',
    key: 'history',
    icon: 'fa fa-calendar-day',
    render: () => <HistoryPane />,
  },
  {
    label: 'Details',
    key: 'details',
    icon: 'fa fa-info-circle',
    render: ({ patient }) => <ConnectedPatientDetailsForm patient={patient} />,
  },
  {
    label: 'Appointments',
    key: 'appointments',
    icon: 'fa fa-user-md',
    render: ({ patient }) => <AppointmentPane patient={patient} />,
  },
  {
    label: 'Referrals',
    key: 'Referrals',
    icon: 'fa fa-hospital',
    render: ({ patient }) => <ReferralPane patient={patient} />,
  },
  {
    label: 'Documents',
    key: 'documents',
    icon: 'fa fa-file-medical-alt',
  },
  {
    label: 'Stickers',
    key: 'stickers',
    icon: '',
    render: ({ patient }) => <PatientStickerLabelPage patient={patient} />,
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
      <RoutedVisitModal patientId={patient._id} referrals={patient.referrals} />
      <RoutedTriageModal patient={patient} />
    </React.Fragment>
  );
});

export const PatientView = connect(state => ({
  loading: state.patient.loading,
  patient: state.patient,
}))(DumbPatientView);
