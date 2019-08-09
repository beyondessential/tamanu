import React from 'react';
import styled from 'styled-components';

import { Tabs, Tab } from '@material-ui/core';

import TopBar from '../components/TopBar';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';

import { DateDisplay } from '../components/DateDisplay';
import { PatientAlert } from '../components/PatientAlert';

import { DetailTable, DetailRow } from '../components/DetailTable';

const ContentPane = styled.div`
  margin: 1rem;
`;

const DataList = styled.ul`
  margin: 0.5rem 1rem;
  padding: 0;
`;

const ListDisplay = React.memo(({ items = [], title, onEdit }) => (
  <div>
    <b>{title}</b>
    <DataList>
      {items.length > 0 ? (
        items.map(x => <li key={x}>{x}</li>)
      ) : (
        <li style={{ opacity: 0.5 }}>None recorded</li>
      )}
    </DataList>
    <Button variant="contained" onClick={onEdit}>
      Edit
    </Button>
  </div>
));

const OngoingConditionDisplay = React.memo(({ patient }) => (
  <ListDisplay title="Conditions" items={patient.conditions.map(x => x.name)} />
));

const AllergyDisplay = React.memo(({ patient }) => (
  <ListDisplay title="Allergies" items={patient.allergies} />
));

const OperativePlanDisplay = React.memo(({ patient }) => (
  <ListDisplay title="Operative Plan" items={patient.operativePlan} />
));

const PatientIssuesDisplay = React.memo(({ patient }) => (
  <ListDisplay title="Other issues" items={patient.issues} />
));

const TABS = [
  {
    label: 'Current visit',
    key: 'visit',
    render: () => <div>visit</div>,
  },
  {
    label: 'History',
    key: 'history',
    render: () => <div>history</div>,
  },
  {
    label: 'Details',
    key: 'details',
    render: () => <div>details</div>,
  },
  {
    label: 'Appointments',
    key: 'appointments',
    render: () => <div>appointments</div>,
  },
  {
    label: 'Documents',
    key: 'documents',
    render: () => <div>documents</div>,
  },
];

const TabDisplay = React.memo(({ tabs, currentTab, onTabSelect }) => {
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
      <ContentPane>{currentTabData.render()}</ContentPane>
    </div>
  );
});

function getCurrentVisit(patient) {
  // TODO: retrieve a current visit if one exists
  return patient.visits[0];
}

export const PatientView = React.memo(({ patient }) => {
  const currentVisit = getCurrentVisit(patient);
  const [currentTab, setCurrentTab] = React.useState(currentVisit ? 'visit' : 'history');
  return (
    <React.Fragment>
      <TopBar title={patient.name} />
      <PatientAlert alerts={patient.alerts} />
      <ContentPane>
        <FormGrid columns={2}>
          <DetailTable>
            <DetailRow label="Name" value={patient.name} />
            <DetailRow label="Sex" value={patient.sex} />
            <DetailRow label="Date of birth">
              <DateDisplay date={patient.dateOfBirth} showDuration />
            </DetailRow>
          </DetailTable>
          <PatientIssuesDisplay patient={patient} />
          <OngoingConditionDisplay patient={patient} />
          <AllergyDisplay patient={patient} />
          <OperativePlanDisplay patient={patient} />
        </FormGrid>
      </ContentPane>
      <TabDisplay tabs={TABS} currentTab={currentTab} onTabSelect={setCurrentTab} />
    </React.Fragment>
  );
});
