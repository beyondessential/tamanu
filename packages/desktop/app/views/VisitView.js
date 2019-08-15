import React from 'react';
import { connect } from 'react-redux';

import TopBar from '../components/TopBar';

import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { TabDisplay } from '../components/TabDisplay';
import { PatientInfoPane } from '../components/PatientInfoPane';
import { ContentPane } from '../components/ContentPane';
import { Table } from '../components/Table';

const vitalsColumns = [
  { key: 'dateRecorded', title: 'Date' },
  { key: 'height', title: 'Height' },
  { key: 'weight', title: 'Weight' },
  { key: 'temperature', title: 'Temperature' },
  { key: 'sbp', title: 'SBP' },
  { key: 'dbp', title: 'DBP' },
  { key: 'heartRate', title: 'Heart rate' },
  { key: 'respiratoryRate', title: 'Respiratory rate' },
];

const VitalsDisplay = connect(state => ({ readings: state.visit.vitals }))(({ readings }) => {
  return (
    <div>
      <Table columns={vitalsColumns} data={readings} />
    </div>
  );
});

const TABS = [
  {
    label: 'Vitals',
    key: 'vitals',
    render: () => <VitalsDisplay />,
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

export const DumbVisitView = React.memo(({ visit, patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('vitals');

  const title = `${patient.firstName} ${patient.lastName} – ${visit.visitType}`;

  return (
    <React.Fragment>
      <TopBar title={title} />
      <LoadingIndicator loading={loading}>
        <TwoColumnDisplay>
          <PatientInfoPane patient={patient} />
          <TabDisplay
            tabs={TABS}
            currentTab={currentTab}
            onTabSelect={setCurrentTab}
            visit={visit}
          />
        </TwoColumnDisplay>
      </LoadingIndicator>
    </React.Fragment>
  );
});

export const VisitView = connect(state => ({
  loading: state.visit.loading,
  visit: state.visit,
  patient: state.patient,
}))(DumbVisitView);
