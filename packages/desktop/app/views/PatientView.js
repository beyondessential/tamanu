import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import TopBar from '../components/TopBar';

import { TabDisplay } from '../components/TabDisplay';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { PatientAlert } from '../components/PatientAlert';
import { PatientHistory } from '../components/PatientHistory';
import { PatientHeader } from '../components/PatientHeader';
import { ContentPane } from '../components/ContentPane';

import { viewVisit } from '../store/visit';

const ConnectedPatientHeader = connect(
  state => ({ ...state.patient }),
)(({ loading, ...patient }) => (
  loading 
    ? <div>{ `Loading patient ${patient.id}` }</div>
    : <PatientHeader patient={patient} />
));

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
      <TopBar title={patient.name} />
      <LoadingIndicator loading={loading}>
        <PatientAlert alerts={patient.alerts} />
        <TwoColumnDisplay>
          <PatientHeader patient={patient} />
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

export const PatientView = connect(
  state => ({ loading: state.patient.loading, patient: state.patient })
)(DumbPatientView);
