import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import TopBar from '../../components/TopBar';

import { Button } from '../../components/Button';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { TabDisplay } from '../../components/TabDisplay';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { ContentPane } from '../../components/ContentPane';
import { VitalsTable } from '../../components/VitalsTable';
import { VitalsModal } from '../../components/VitalsModal';

import { FormGrid } from '../../components/FormGrid';
import { SelectInput, DateInput, TextInput } from '../../components/Field';
import { visitOptions } from '../../constants';

const VitalsPane = React.memo(({ visit }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      {modalOpen && <VitalsModal visitId={visit._id} onClose={() => setModalOpen(false)} />}
      <VitalsTable />
      <ContentPane>
        <Button onClick={() => setModalOpen(true)} variant="contained" color="primary">
          Record vitals
        </Button>
      </ContentPane>
    </div>
  );
});

const TABS = [
  {
    label: 'Vitals',
    key: 'vitals',
    render: ({ visit }) => <VitalsPane visit={visit} />,
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

const BackLink = connect(
  null,
  dispatch => ({ onClick: () => dispatch(push('/patients/view')) }),
)(({ onClick }) => <Button onClick={onClick}>&lt; Back to patient information</Button>);

const VisitInfoPane = React.memo(({ visit }) => (
  <FormGrid columns={3}>
    <DateInput value={visit.startDate} label="Admission date" />
    <DateInput value={visit.endDate} label="Discharge date" />
    <TextInput value={visit.location} label="Location" />
    <SelectInput value={visit.visitType} label="Visit type" options={visitOptions} />
    <TextInput value={visit.examiner} label="Doctor/nurse" />
    <TextInput
      value={visit.reasonForVisit}
      label="Reason for visit"
      style={{ gridColumn: 'span 3' }}
    />
  </FormGrid>
));

export const DumbVisitView = React.memo(({ visit, patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('vitals');

  return (
    <React.Fragment>
      <TopBar title="Patient visit">
        <Button>Discharge patient</Button>
      </TopBar>
      <LoadingIndicator loading={loading}>
        <TwoColumnDisplay>
          <PatientInfoPane patient={patient} />
          <div>
            <BackLink />
            <ContentPane>
              <VisitInfoPane visit={visit} />
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
