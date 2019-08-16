import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { PatientSearchBar, NewPatientModal } from './components';
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

const DumbPatientListingView = React.memo(({ handleRowClick }) => {
  const [searchParameters, setSearchParameters] = useState({});
  const [creatingPatient, setCreatingPatient] = useState(false);

  const toggleCreatingPatient = useCallback(() => {
    setCreatingPatient(!creatingPatient);
  }, [creatingPatient]);

  return (
    <PageContainer>
      <TopBar title="Patient listing">
        <Button color="primary" variant="contained" onClick={toggleCreatingPatient}>
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
      <NewPatientModal
        title="New patient"
        open={creatingPatient}
        onCancel={toggleCreatingPatient}
      />
    </PageContainer>
  );
});

export const PatientListingView = connect(
  null,
  dispatch => ({ handleRowClick: ({ _id }) => dispatch(viewPatient(_id)) }),
)(DumbPatientListingView);
