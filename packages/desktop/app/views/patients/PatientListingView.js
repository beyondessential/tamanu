import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { DropdownButton } from '../../components/DropdownButton';
import { PatientSearchBar, NewPatientModal } from './components';
import {
  displayId,
  firstName,
  lastName,
  culturalName,
  village,
  sex,
  dateOfBirth,
  status,
  location,
  department,
} from './columns';

const PATIENT_SEARCH_ENDPOINT = 'patient/search';
const INPATIENT_ENDPOINT = 'inpatient';
const OUTPATIENT_ENDPOINT = 'outpatient';

const BASE_COLUMNS = [displayId, firstName, lastName, culturalName, village, sex, dateOfBirth];

const BASE_COLUMNS_ON_PATIENT = BASE_COLUMNS.map(column => ({
  ...column,
  sortable: false,
}));

const LISTING_COLUMNS = [...BASE_COLUMNS, status];
const INPATIENT_COLUMNS = [...BASE_COLUMNS_ON_PATIENT, location, department];

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

const NewPatientButton = React.memo(() => {
  const [isCreatingPatient, setCreatingPatient] = useState(false);
  const [isBirth, setIsBirth] = useState(false);
  const hideModal = useCallback(() => setCreatingPatient(false), [setCreatingPatient]);

  const showNewPatient = useCallback(() => {
    setCreatingPatient(true);
    setIsBirth(false);
  }, [setCreatingPatient, setIsBirth]);

  const showNewBirth = useCallback(() => {
    setCreatingPatient(true);
    setIsBirth(true);
  }, [setCreatingPatient, setIsBirth]);

  return (
    <React.Fragment>
      <DropdownButton
        color="primary"
        actions={[
          { label: 'Create new patient', onClick: showNewPatient },
          { label: 'Register birth', onClick: showNewBirth },
        ]}
      />
      <NewPatientModal
        title="New patient"
        isBirth={isBirth}
        open={isCreatingPatient}
        onCancel={hideModal}
      />
    </React.Fragment>
  );
});

export const PatientListingView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <PageContainer>
      <TopBar title="Patient listing">
        <NewPatientButton />
      </TopBar>
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable
        endpoint={PATIENT_SEARCH_ENDPOINT}
        fetchOptions={searchParameters}
        columns={LISTING_COLUMNS}
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

export const AdmittedPatientsView = React.memo(() => (
  <PageContainer>
    <TopBar title="Admitted patient listing" />
    <PatientTable
      endpoint={INPATIENT_ENDPOINT}
      transformRow={annotateVisitWithPatientData}
      columns={INPATIENT_COLUMNS}
    />
  </PageContainer>
));

export const OutpatientsView = React.memo(() => (
  <PageContainer>
    <TopBar title="Outpatient listing" />
    <PatientTable
      endpoint={OUTPATIENT_ENDPOINT}
      transformRow={annotateVisitWithPatientData}
      columns={INPATIENT_COLUMNS}
    />
  </PageContainer>
));
