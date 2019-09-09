import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { TriageModal } from '../../components/TriageModal';
import { displayId, firstName, lastName, culturalName, sex, dateOfBirth } from './columns';

const TRIAGE_ENDPOINT = 'triage';

const COLUMNS = [
  displayId,
  firstName,
  lastName,
  sex,
  dateOfBirth,
  {
    key: 'score',
    title: 'Triage score',
  },
  {
    key: 'status',
    title: 'Status',
  },
  {
    key: 'location',
    title: 'Location',
  },
  {
    key: 'waitingTime',
    title: 'Waiting time',
  }
];

const DumbTriageView = React.memo(({ handleRowClick }) => {
  const [isTriageOpen, setTriageOpen] = useState(false);

  return (
    <PageContainer>
      <TopBar title="Emergency">
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
