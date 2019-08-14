import React, { useState } from 'react';
import {
  TopBar,
  PageContainer,
  Button,
  PatientSearchBar,
  DataFetchingTable,
} from '../../components';
import { push } from 'connected-react-router';
import { displayId, firstName, lastName, sex, dateOfBirth } from './columns';
import { PATIENT_SEARCH_ENDPOINT } from './constants';

const COLUMNS = [
  displayId,
  firstName,
  lastName,
  sex,
  dateOfBirth,
  {
    key: 'actions',
    title: 'Actions',
  },
];

export const PatientListing = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <PageContainer>
      <TopBar title="Patient listing">
        <Button color="primary" variant="contained" onClick={() => push('/patient/new')}>
          Create new patient
        </Button>
      </TopBar>
      <PatientSearchBar onSearch={setSearchParameters} />
      <DataFetchingTable
        endpoint={PATIENT_SEARCH_ENDPOINT}
        columns={COLUMNS}
        fetchOptions={searchParameters}
        noDataMessage="No patients found"
      />
    </PageContainer>
  );
});
