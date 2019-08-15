import React from 'react';
import { connect } from 'react-redux';

import TopBar from '../components/TopBar';

import { TabDisplay } from '../components/TabDisplay';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { PatientAlert } from '../components/PatientAlert';
import { PatientHistory } from '../components/PatientHistory';
import { PatientInfoPane } from '../components/PatientInfoPane';
import { ContentPane } from '../components/ContentPane';

import { viewVisit } from '../store/visit';

const ConnectedPatientHistory = connect(
  state => ({ items: state.patient.visits }),
  dispatch => ({
    onItemClick: item => dispatch(viewVisit(item._id)),
  }),
)(PatientHistory);

const TABS = [
  {
    label: 'History',
    key: 'history',
    render: () => <ConnectedPatientHistory />,
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
