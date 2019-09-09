import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';

import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { DateDisplay } from '../../components/DateDisplay';
import { TriageModal } from '../../components/TriageModal';
import { displayId, firstName, lastName, culturalName, sex, dateOfBirth } from './columns';

const TRIAGE_ENDPOINT = 'triage';

const MINUTE = 60 * 1000;

const Timer = React.memo(({ startTime }) => {
  const [_, forceRender] = React.useState({});
  React.useEffect(() => {
    const i = setInterval(() => forceRender({}), MINUTE);
    return () => clearTimeout(i);
  }, []);

  const diff = new Date() - new Date(startTime);
  const minutes = Math.floor(diff / MINUTE);

  return `${minutes} minutes`;
});

const COLUMNS = [
  { key: 'patient._id', title: 'ID', accessor: (triage) => triage.patient._id },
  { key: 'name', title: 'Patient', accessor: ({patient}) => `${patient.firstName} ${patient.lastName}` },
  { key: 'sex', title: 'Sex', accessor: ({patient}) => patient.sex },
  { key: 'dateOfBirth', title: 'Date of birth', accessor: ({patient}) => <DateDisplay date={patient.dateOfBirth} /> },
  { key: 'score', title: 'Triage score', },
  { key: 'status', title: 'Status' },
  { key: 'location', title: 'Location', accessor: ({ location }) => location.name },
  { key: 'triageTime', title: 'Waiting time', accessor: (triage) => <Timer startTime={triage.triageTime} /> }
];

const DumbTriageView = React.memo(({ handleRowClick }) => {
  const [isTriageOpen, setTriageOpen] = useState(false);
  const [editedTriage, setEditedTriage] = useState(null);

  return (
    <PageContainer>
      <TopBar title="Emergency department list">
        <Button color="primary" variant="outlined" onClick={() => {
          setEditedTriage(null);
          setTriageOpen(true);
        }}>
          New triage
        </Button>
      </TopBar>
      <DataFetchingTable
        endpoint={TRIAGE_ENDPOINT}
        columns={COLUMNS}
        noDataMessage="No patients waiting"
        onRowClick={(triage) => {
          setEditedTriage(triage);
          setTriageOpen(true);
        }}
      />
      <TriageModal
        title="Triage"
        open={isTriageOpen}
        triage={editedTriage}
        onClose={() => setTriageOpen(false)}
      />
    </PageContainer>
  );
});

export const TriageView = connect(
  null,
  dispatch => ({ handleRowClick: ({ _id }) => dispatch(viewTriage(_id)) }),
)(DumbTriageView);
