import React from 'react';
import styled from 'styled-components';

import { Tabs, Tab } from '@material-ui/core';

import TopBar from '../components/TopBar';

import { PatientAlert } from '../components/PatientAlert';
import { PatientHistory } from '../components/PatientHistory';
import { PatientHeader } from '../components/PatientHeader';
import { ContentPane } from '../components/ContentPane';

const TABS = [
  {
    label: 'Current visit',
    key: 'visit',
    render: ({ patient }) => {
      const visit = getCurrentVisit(patient);
      if (!visit) return "No visit";
      return (
        <ContentPane>{ visit.visitType }</ContentPane>
      );
    },
  },
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

const TabDisplay = React.memo(({ tabs, currentTab, onTabSelect, patient }) => {
  const currentTabData = tabs.find(t => t.key === currentTab);
  const buttons = tabs.map(({ key, label }) => (
    <Tab
      key={key}
      style={{ minWidth: 'auto' }}
      label={label}
      value={key}
      onClick={() => onTabSelect(key)}
    />
  ));
  return (
    <div>
      <Tabs value={currentTab}>{buttons}</Tabs>
      <div>{currentTabData.render({ patient })}</div>
    </div>
  );
});

function isVisitCurrent(visit) {
  return !visit.endDate;
}

function getCurrentVisit(patient) {
  return patient.visits.find(isVisitCurrent);
}

export const PatientView = React.memo(({ patient }) => {
  const currentVisit = getCurrentVisit(patient);
  const [currentTab, setCurrentTab] = React.useState(currentVisit ? 'visit' : 'history');
  return (
    <React.Fragment>
      <TopBar title={patient.name} />
      <PatientAlert alerts={patient.alerts} />
      <PatientHeader patient={patient} />
      <TabDisplay
        patient={patient}
        tabs={TABS}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
      />
    </React.Fragment>
  );
});
