import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';

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
import { Button, ImageButton } from '../../components/Button';
import { connectRoutedModal } from '../../components/Modal';

import { viewVisit } from '../../store/visit';

import { getCurrentVisit } from '../../store/patient';

const CallToActionRow = styled(ContentPane)`
  display: flex;

  > button {
    :not(:last-child) {
      margin-right: 10px;
    }
  }
`;

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
    isCheckInAvailable: !getCurrentVisit(state),
  }),
  dispatch => ({
    onViewVisit: id => dispatch(viewVisit(id)),
    onOpenCheckin: () => dispatch(push('/patients/view/checkin')),
    onOpenTriage: () => dispatch(push('/patients/view/triage')),
  }),
)(
  React.memo(({ visits, onOpenCheckin, onOpenTriage, onViewVisit, isCheckInAvailable }) => (
    <div>
      <CallToActionRow>
        <ImageButton
          src="./assets/images/medication.svg"
          title="Check in"
          disabled={!isCheckInAvailable}
          onClick={onOpenCheckin}
        >
          Check In
        </ImageButton>
        <ImageButton
          src="./assets/images/profile.svg"
          title="Triage"
          disabled={!isCheckInAvailable}
          onClick={onOpenTriage}
        >
          Triage
        </ImageButton>
      </CallToActionRow>
      <PatientHistory items={visits} onItemClick={item => onViewVisit(item._id)} />
    </div>
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
];

export const DumbPatientView = React.memo(({ patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('history');
  const { firstName, lastName, sex, dateOfBirth } = patient;

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
      <RoutedTriageModal
        firstName={firstName}
        lastName={lastName}
        sex={sex}
        dateOfBirth={dateOfBirth}
        patientId={patient._id}
      />
    </React.Fragment>
  );
});

export const PatientView = connect(state => ({
  loading: state.patient.loading,
  patient: state.patient,
}))(DumbPatientView);
