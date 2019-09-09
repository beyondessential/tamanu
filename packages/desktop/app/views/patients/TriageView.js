import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';

import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { DateDisplay } from '../../components/DateDisplay';
import { TriageModal } from '../../components/TriageModal';
import { displayId, firstName, lastName, culturalName, sex, dateOfBirth } from './columns';

const TRIAGE_ENDPOINT = 'triage';

const Timer = React.memo(({ startTime }) => {
  const [shownTime, setShownTime] = React.useState("");

  const diff = new Date() - new Date(startTime);

  return Math.floor(diff / 1000);
});

const COLUMNS = [
  { key: 'patient._id', title: 'ID', accessor: (triage) => triage.patient._id },
  { key: 'name', title: 'Patient', accessor: ({patient}) => `${patient.firstName} ${patient.lastName}` },
  { key: 'sex', title: 'Sex', accessor: ({patient}) => patient.sex },
  { key: 'dateOfBirth', title: 'Date of birth', accessor: ({patient}) => <DateDisplay date={patient.dateOfBirth} /> },
  { key: 'score', title: 'Triage score', },
  { key: 'status', title: 'Status', accessor: () => "Waiting" },
  { key: 'location', title: 'Location', accessor: ({ location }) => location.name },
  { key: 'triageTime', title: 'Waiting time', accessor: (triage) => <Timer startTime={triage.triageTime} /> }
];

const DumbTriageView = React.memo(({ handleRowClick }) => {
  const [isTriageOpen, setTriageOpen] = useState(false);

  return (
    <PageContainer>
      <TopBar title="Emergency department list">
        <Button color="primary" variant="outlined" onClick={() => setTriageOpen(true)}>
          New triage
        </Button>
      </TopBar>
      <DataFetchingTable
        endpoint={TRIAGE_ENDPOINT}
        columns={COLUMNS}
        noDataMessage="No patients waiting"
        onRowClick={handleRowClick}
      />
      <TriageModal
        title="Triage"
        open={isTriageOpen}
        onClose={() => setTriageOpen(false)}
      />
    </PageContainer>
  );
});

export const TriageView = connect(
  null,
  dispatch => ({ handleRowClick: ({ _id }) => dispatch(viewPatient(_id)) }),
)(DumbTriageView);
