import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { PatientSearchBar, NewPatientModal } from './components';
import {
  displayId,
  firstName,
  lastName,
  culturalName,
  sex,
  dateOfBirth,
  status,
  location,
  department,
} from './columns';
import { PATIENT_SEARCH_ENDPOINT } from './constants';

const BASE_COLUMNS = [displayId, firstName, lastName, culturalName, sex, dateOfBirth];
const LISTING_COLUMNS = [...BASE_COLUMNS, status];
const INPATIENT_COLUMNS = [...BASE_COLUMNS, location, department];

const PatientTable = connect(
  null,
  dispatch => ({ onViewPatient: id => dispatch(viewPatient(id)) }),
)(
  React.memo(({ onViewPatient, columns, ...props }) => (
    <DataFetchingTable
      columns={columns}
      noDataMessage="No patients found"
      onRowClick={row => onViewPatient(row._id)}
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
      <PatientTable
        endpoint={PATIENT_SEARCH_ENDPOINT}
        fetchOptions={searchParameters}
        columns={LISTING_COLUMNS}
      />
      <NewPatientModal
        title="New patient"
        open={creatingPatient}
        onCancel={toggleCreatingPatient}
      />
    </PageContainer>
  );
});

// Allow a "patient view" table to receive a list of visits instead
function annotateVisitWithPatientData(visit) {
  return {
    ...visit,
    ...visit.patient[0],
    visits: [visit],
  };
}

export const AdmittedPatientsView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <PageContainer>
      <TopBar title="Admitted patient listing" />
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable
        endpoint="inpatient"
        fetchOptions={searchParameters}
        transformRow={annotateVisitWithPatientData}
        columns={INPATIENT_COLUMNS}
      />
    </PageContainer>
  );
});

export const OutpatientsView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <PageContainer>
      <TopBar title="Outpatient listing" />
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable
        endpoint="outpatient"
        fetchOptions={searchParameters}
        transformRow={annotateVisitWithPatientData}
        columns={INPATIENT_COLUMNS}
      />
    </PageContainer>
  );
});
