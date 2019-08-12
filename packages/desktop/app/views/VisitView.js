import React from 'react';
import styled from 'styled-components';

import { Tabs, Tab } from '@material-ui/core';

import TopBar from '../components/TopBar';

import { TabDisplay } from '../components/TabDisplay';
import { PatientAlert } from '../components/PatientAlert';
import { PatientHistory } from '../components/PatientHistory';
import { PatientHeader } from '../components/PatientHeader';
import { ContentPane } from '../components/ContentPane';

const TABS = [
  {
    label: 'Vitals',
    key: 'vitals',
    render: () => <ContentPane>Vitals</ContentPane>,
  },
  {
    label: 'Notes',
    key: 'notes',
    render: () => <ContentPane>Notes</ContentPane>,
  },
  {
    label: 'Procedures',
    key: 'procedures',
    render: () => <ContentPane>Procedures</ContentPane>,
  },
  {
    label: 'Labs',
    key: 'labs',
    render: () => <ContentPane>Labs</ContentPane>,
  },
  {
    label: 'Documents',
    key: 'documents',
    render: () => <ContentPane>Documents</ContentPane>,
  },
];

export const VisitView = React.memo(({ visit, patient }) => {
  const [currentTab, setCurrentTab] = React.useState('vitals');

  return (
    <React.Fragment>
      <TopBar title={patient.name} />
      <PatientHeader patient={patient} />
      <TabDisplay
        tabs={TABS}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        visit={visit}
      />
    </React.Fragment>
  );
});
