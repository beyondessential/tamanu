import React from 'react';
import { connect } from 'react-redux';

import TopBar from '../components/TopBar';

import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { TabDisplay } from '../components/TabDisplay';
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

export const DumbVisitView = React.memo(({ visit, patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('vitals');

  const title = `${patient.name} – ${visit.visitType}`;

  return (
    <React.Fragment>
      <TopBar title={title} />
      <LoadingIndicator loading={loading}>
        <TwoColumnDisplay>
          <PatientHeader patient={patient} />
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
