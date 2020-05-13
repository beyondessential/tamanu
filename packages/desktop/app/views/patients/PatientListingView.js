import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, DataFetchingTable } from '../../components';
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

const PATIENT_SEARCH_ENDPOINT = 'patient';
const INPATIENT_ENDPOINT = 'inpatient';
const OUTPATIENT_ENDPOINT = 'outpatient';

const BASE_COLUMNS = [displayId, firstName, lastName, culturalName, village, sex, dateOfBirth];

const BASE_COLUMNS_ON_PATIENT = BASE_COLUMNS.map(column => ({
  ...column,
  sortable: false,
}));

const LISTING_COLUMNS = [...BASE_COLUMNS, status];
const INPATIENT_COLUMNS = [...BASE_COLUMNS_ON_PATIENT, location, department];

const PatientTable = React.memo(({ onViewPatient, showInpatientDetails, ...props }) => (
  <DataFetchingTable
    columns={showInpatientDetails ? INPATIENT_COLUMNS : LISTING_COLUMNS}
    noDataMessage="No patients found"
    onRowClick={row => onViewPatient(row._id)}
    {...props}
  />
));

const NewPatientButton = React.memo(({ onCreateNewPatient }) => {
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

  const onCreate = useCallback(newPatient => {
    setCreatingPatient(false);
    onCreateNewPatient(newPatient._id);
  });

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
        onCreateNewPatient={onCreate}
      />
    </React.Fragment>
  );
});

const selectPatientConnector = connect(
  null,
  dispatch => ({ onViewPatient: id => dispatch(viewPatient(id)) }),
);

export const DumbPatientListingView = React.memo(({ onViewPatient }) => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <PageContainer>
      <TopBar title="Patient listing">
        <NewPatientButton onCreateNewPatient={onViewPatient} />
      </TopBar>
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable
        endpoint={PATIENT_SEARCH_ENDPOINT}
        fetchOptions={searchParameters}
        onViewPatient={onViewPatient}
      />
    </PageContainer>
  );
});

export const PatientListingView = selectPatientConnector(DumbPatientListingView);

// Allow a "patient view" table to receive a list of visits instead
function annotateVisitWithPatientData(visit) {
  return {
    ...visit,
    ...visit.patient[0],
    visits: [visit],
  };
}

export const AdmittedPatientsView = selectPatientConnector(
  React.memo(({ onViewPatient }) => (
    <PageContainer>
      <TopBar title="Admitted patient listing" />
      <PatientTable
        onViewPatient={onViewPatient}
        endpoint={INPATIENT_ENDPOINT}
        transformRow={annotateVisitWithPatientData}
        showInpatientDetails
      />
    </PageContainer>
  )),
);

export const OutpatientsView = selectPatientConnector(
  React.memo(({ onViewPatient }) => (
    <PageContainer>
      <TopBar title="Outpatient listing" />
      <PatientTable
        onViewPatient={onViewPatient}
        endpoint={OUTPATIENT_ENDPOINT}
        transformRow={annotateVisitWithPatientData}
        showInpatientDetails
      />
    </PageContainer>
  )),
);
