import React from 'react';
import styled from 'styled-components';

import TopBar from '../components/TopBar';

import { TabDisplay } from '../components/TabDisplay';
import { PatientAlert } from '../components/PatientAlert';
import { PatientHistory } from '../components/PatientHistory';
import { PatientHeader } from '../components/PatientHeader';
import { ContentPane } from '../components/ContentPane';

const TABS = [
  {
    label: 'History',
    key: 'history',
    render: ({ patient }) => <PatientHistory items={patient.visits} />,
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

function isVisitCurrent(visit) {
  return !visit.endDate;
}

function getCurrentVisit(patient) {
  return patient.visits.find(isVisitCurrent);
}

const Preloader = ({ loading, children }) => (
  loading 
    ? <div>Loading...</div>
    : children
);

const Columns = styled.div`
  display: grid;
  grid-template-columns: 20rem auto;
`;

export const PatientView = React.memo(({ patient, loading }) => {
  const currentVisit = getCurrentVisit(patient);
  const [currentTab, setCurrentTab] = React.useState(currentVisit ? 'visit' : 'history');
  return (
    <React.Fragment>
      <TopBar title={patient.name} />
      <Preloader loading={loading}>
        <PatientAlert alerts={patient.alerts} />
        <Columns>
          <PatientHeader patient={patient} />
          <TabDisplay
            tabs={TABS}
            currentTab={currentTab}
            onTabSelect={setCurrentTab}
            patient={patient}
          />
        </Columns>
      </Preloader>
    </React.Fragment>
  );
});
