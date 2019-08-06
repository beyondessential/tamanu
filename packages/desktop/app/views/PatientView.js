import React from 'react';

import { Tabs, Tab } from '@material-ui/core';

import TopBar from '../components/TopBar';
import { FormGrid } from '../components/FormGrid';
import { Modal } from '../components/Modal';

const ContentPane = React.memo(({ children }) => (
  <div>{children}</div>
));

const OngoingConditionDisplay = React.memo(({ patient }) => (
  <div>condition</div>
));

const AllergyDisplay = React.memo(({ patient }) => (
  <div>allergies</div>
));

const OperativePlanDisplay = React.memo(({ patient }) => (
  <div>operative plan</div>
));

const PatientIssuesDisplay = React.memo(({ patient }) => (
  <div>issues</div>
));

const AlertsDialog = React.memo(({ alerts }) => {
  const alertExists = alerts.length > 0;
  const [alertVisible, setAlertVisible] = React.useState(alertExists);

  return (
    <Modal 
      title="Patient warnings" 
      isVisible={alertVisible}
      onClose={() => setAlertVisible(false)}
    ><ul>{alerts.map(a => <li key={a}>{a}</li>)}</ul></Modal>
  );
});

const TABS = [
  {
    label: 'Current visit',
    key: 'visit',
    render: () => (<div>visit</div>),
  },
  { 
    label: 'History',
    key: 'history', 
    render: () => (<div>history</div>),
  },
  { 
    label: 'Details',
    key: 'details', 
    render: () => (<div>details</div>),
  },
  { 
    label: 'Appointments',
    key: 'appointments', 
    render: () => (<div>appointments</div>),
  },
  { 
    label: 'Documents',
    key: 'documents', 
    render: () => (<div>documents</div>),
  },
];

const TabDisplay = React.memo(({ tabs, currentTab, onTabSelect }) => {
  const currentTabData = tabs.find(t => t.key === currentTab);
  const buttons = tabs.map(t => (
    <Tab
      key={t.key}
      style={{ minWidth: 'auto' }}
      label={t.label}
      value={t.key}
      onClick={() => onTabSelect(t.key)}
    />
  ));
  return (
    <div>
      <Tabs value={currentTab}>{buttons}</Tabs>
      <div>{currentTabData.render()}</div>
    </div>
  );
});

export const PatientView = React.memo(({ patient }) => {
  const currentVisit = patient.visits[0];
  const [currentTab, setCurrentTab] = React.useState(currentVisit ? "visit" : "history");
  return (
    <React.Fragment>
      <TopBar title={patient.name} />
      <AlertsDialog alerts={patient.alerts || []} />
      <ContentPane>
        <FormGrid columns={2}>
          <OngoingConditionDisplay patient={patient} />
          <AllergyDisplay patient={patient} />
          <OperativePlanDisplay patient={patient} />
        </FormGrid>
        <TabDisplay
          tabs={TABS} 
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
        />
      </ContentPane>
    </React.Fragment>
  );
});
