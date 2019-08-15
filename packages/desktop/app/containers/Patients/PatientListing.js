import React, { useState } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { viewPatient } from '../../store/patient';
import {
  TopBar,
  PageContainer,
  Button,
  PatientSearchBar,
  DataFetchingTable,
} from '../../components';
import { displayId, firstName, lastName, culturalName, sex, dateOfBirth } from './columns';
import { PATIENT_SEARCH_ENDPOINT } from './constants';

const COLUMNS = [
  displayId,
  firstName,
  lastName,
  culturalName,
  sex,
  dateOfBirth,
  {
    key: 'actions',
    title: 'Actions',
  },
];

const DumbPatientListing = React.memo(({ handleRowClick }) => {
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
        onRowClick={handleRowClick}
      />
    </PageContainer>
  );
});

export const PatientListing = connect(
  null,
  dispatch => ({ handleRowClick: ({ _id }) => dispatch(viewPatient(_id)) }),
)(DumbPatientListing);
