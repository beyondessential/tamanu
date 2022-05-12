import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, DataFetchingTable, AutocompleteField } from '../../components';
import { DropdownButton } from '../../components/DropdownButton';
import { PatientSearchBar, NewPatientModal } from './components';

import {
  markedForSync,
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
import { Suggester } from '../../utils/suggester';
import { useApi } from '../../api';

const PATIENT_SEARCH_ENDPOINT = 'patient';

const LISTING_COLUMNS = [
  markedForSync,
  displayId,
  firstName,
  lastName,
  culturalName,
  village,
  sex,
  dateOfBirth,
  status,
];

const INPATIENT_COLUMNS = [markedForSync, displayId, firstName, lastName, sex, dateOfBirth]
  .map(column => ({
    ...column,
    sortable: false,
  }))
  // the above columns are not sortable due to backend query
  // https://github.com/beyondessential/tamanu/pull/2029#issuecomment-1090981599
  // location and department should be sortable
  .concat([location, department]);

const StyledDataTable = styled(DataFetchingTable)`
  margin: 24px;
`;

const PatientTable = ({ onViewPatient, showInpatientDetails, fetchOptions, ...props }) => {
  const [searchParameters, setSearchParameters] = useState({});
  const api = useApi();
  const dispatch = useDispatch();
  const INPATIENT_SEARCH_FIELDS = useMemo(
    () => [
      'displayId',
      'firstName',
      'lastName',
      'dateOfBirthExact',
      [
        'facilityId',
        {
          placeholder: 'Facility',
          suggester: new Suggester(api, 'facility'),
          component: AutocompleteField,
        },
      ],
      [
        'locationId',
        {
          placeholder: 'Location',
          suggester: new Suggester(api, 'location'),
          component: AutocompleteField,
        },
      ],
      [
        'departmentId',
        {
          placeholder: 'Department',
          suggester: new Suggester(api, 'department'),
          component: AutocompleteField,
        },
      ],
      [
        'clinicianId',
        {
          placeholder: 'Clinician',
          suggester: new Suggester(api, 'practitioner'),
          component: AutocompleteField,
        },
      ],
    ],
    [api],
  );
  const columns = showInpatientDetails ? INPATIENT_COLUMNS : LISTING_COLUMNS;
  const fetchOptionsWithSearchParameters = { ...searchParameters, ...fetchOptions };
  return (
    <>
      <PatientSearchBar
        onSearch={setSearchParameters}
        fields={showInpatientDetails ? INPATIENT_SEARCH_FIELDS : undefined}
        showDeceasedPatientsCheckbox={!showInpatientDetails}
      />
      <StyledDataTable
        columns={columns}
        noDataMessage="No patients found"
        onRowClick={row => {
          if (onViewPatient) {
            onViewPatient(row.id);
          } else {
            dispatch(viewPatient(row.id));
          }
        }}
        rowStyle={({ patientStatus }) =>
          patientStatus === 'deceased' ? '& > td:not(:first-child) { color: #ed333a; }' : ''
        }
        fetchOptions={fetchOptionsWithSearchParameters}
        endpoint={PATIENT_SEARCH_ENDPOINT}
        {...props}
      />
    </>
  );
};

const NewPatientButton = ({ onCreateNewPatient }) => {
  const [isCreatingPatient, setCreatingPatient] = useState(false);
  const [isBirth, setIsBirth] = useState(false);
  const dispatch = useDispatch();
  const hideModal = useCallback(() => setCreatingPatient(false), [setCreatingPatient]);

  const showNewPatient = useCallback(() => {
    setCreatingPatient(true);
    setIsBirth(false);
  }, []);

  const showNewBirth = useCallback(() => {
    setCreatingPatient(true);
    setIsBirth(true);
  }, []);

  return (
    <>
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
        onCreateNewPatient={newPatient => {
          setCreatingPatient(false);
          if (onCreateNewPatient) {
            onCreateNewPatient(newPatient.id);
          } else {
            dispatch(viewPatient(newPatient.id));
          }
        }}
      />
    </>
  );
};

export const PatientListingView = ({ onViewPatient }) => {
  return (
    <PageContainer>
      <TopBar title="Patient listing">
        <NewPatientButton onCreateNewPatient={onViewPatient} />
      </TopBar>
      <PatientTable onViewPatient={onViewPatient} />
    </PageContainer>
  );
};

export const AdmittedPatientsView = () => (
  <PageContainer>
    <TopBar title="Admitted patient listing" />
    <PatientTable fetchOptions={{ inpatient: 1 }} showInpatientDetails />
  </PageContainer>
);

export const OutpatientsView = () => (
  <PageContainer>
    <TopBar title="Outpatient listing" />
    <PatientTable fetchOptions={{ outpatient: 1 }} showInpatientDetails />
  </PageContainer>
);
