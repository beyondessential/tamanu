import React from 'react';
import { connect } from 'react-redux';

import TopBar from '../components/TopBar';

import { APIForm } from '../api/connectApi';
import { VisitForm } from '../forms/VisitForm';

import { Button } from '../components/Button';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { TabDisplay } from '../components/TabDisplay';
import { PatientHeader } from '../components/PatientHeader';
import { ContentPane } from '../components/ContentPane';
import { VitalsTable } from '../components/VitalsTable';
import { DateDisplay } from '../components/DateDisplay';

const TABS = [
  {
    label: 'Vitals',
    key: 'vitals',
    render: () => <VitalsTable />,
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

const BackLink = () => (
  <div>
    <a href="/patients/view" onClick={() => null}>Back to patient information</a>
  </div>
);

export const DumbVisitView = React.memo(({ visit, patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('vitals');

  const title = (
    <span>
      <span>{`${patient.firstName} ${patient.lastName}`}</span>
      <span>{` – ${visit.visitType}`}</span>
      <span> – </span>
      <DateDisplay date={visit.startDate} />
    </span>
  );

  return (
    <React.Fragment>
      <TopBar title="Patient visit">
        <Button>Discharge patient</Button>
      </TopBar>
      <LoadingIndicator loading={loading}>
        <TwoColumnDisplay>
          <PatientHeader patient={patient} />
          <div>
            <BackLink />
            <ContentPane>
              <VisitForm editedObject={visit} onSubmit={() => null} />
            </ContentPane>
            <TabDisplay
              tabs={TABS}
              currentTab={currentTab}
              onTabSelect={setCurrentTab}
              visit={visit}
            />
          </div>
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
