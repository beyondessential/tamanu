import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { PatientSearchBar, NewPatientModal } from './components';
import { displayId, firstName, lastName, culturalName, sex, dateOfBirth, status } from './columns';
import { PATIENT_SEARCH_ENDPOINT } from './constants';

const COLUMNS = [displayId, firstName, lastName, culturalName, sex, dateOfBirth, status];

const PatientTable = connect(
  null,
  dispatch => ({ viewPatient: id => dispatch(viewPatient(id)) }),
)(
  React.memo(({ viewPatient, ...props }) => (
    <DataFetchingTable
      endpoint={PATIENT_SEARCH_ENDPOINT}
      columns={COLUMNS}
      noDataMessage="No patients found"
      onRowClick={row => viewPatient(row._id)}
      {...props}
    />
  )),
);

export const PatientListingView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});
  const [creatingPatient, setCreatingPatient] = useState(false);

  const toggleCreatingPatient = useCallback(() => {
    setCreatingPatient(!creatingPatient);
  }, [creatingPatient]);

  return (
    <PageContainer>
      <TopBar title="Patient listing">
        <Button color="primary" variant="outlined" onClick={toggleCreatingPatient}>
          Create new patient
        </Button>
      </TopBar>
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable fetchOptions={searchParameters} />
      <NewPatientModal
        title="New patient"
        open={creatingPatient}
        onCancel={toggleCreatingPatient}
      />
    </PageContainer>
  );
});

export const AdmittedPatientsView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});

  const fullParameters = {
    'visits.endDate': null,
    ...searchParameters,
  };

  return (
    <PageContainer>
      <TopBar title="Admitted patient listing" />
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable fetchOptions={fullParameters} />
    </PageContainer>
  );
});
