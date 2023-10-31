import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { LocationCell, LocationGroupCell } from '../../components/LocationCell';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { reloadPatient } from '../../store/patient';
import {
  TopBar,
  PageContainer,
  AllPatientsSearchBar,
  PatientSearchBar,
  ContentPane,
  SearchTable,
  SearchTableTitle,
} from '../../components';
import { RecentlyViewedPatientsList } from '../../components/RecentlyViewedPatientsList';
import { ButtonWithPermissionCheck } from '../../components/Button';
import { NewPatientModal } from './components';
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
  department,
  clinician,
} from './columns';
import { useAuth } from '../../contexts/Auth';
import { usePatientSearch, PatientSearchKeys } from '../../contexts/PatientSearch';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const PATIENT_SEARCH_ENDPOINT = 'patient';

const LISTING_COLUMNS = [
  markedForSync,
  displayId,
  firstName,
  lastName,
  culturalName,
  dateOfBirth,
  sex,
  village,
  status,
];

const location = {
  key: 'locationName',
  title: 'Location',
  accessor: LocationCell,
};

const locationGroup = {
  key: 'locationGroupName',
  title: 'Area',
  accessor: LocationGroupCell,
};

const INPATIENT_COLUMNS = [markedForSync, displayId, firstName, lastName, dateOfBirth, sex].concat(
  [locationGroup, location, department, clinician].map(column => ({
    ...column,
    sortable: false,
  })),
);

const PatientTable = ({ columns, fetchOptions, searchParameters }) => {
  const { navigateToPatient } = usePatientNavigation();
  const dispatch = useDispatch();
  const fetchOptionsWithSearchParameters = { ...searchParameters, ...fetchOptions };

  const handleViewPatient = async row => {
    await dispatch(reloadPatient(row.id));
    navigateToPatient(row.id);
  };

  return (
    <SearchTable
      columns={columns}
      noDataMessage="No patients found"
      onRowClick={handleViewPatient}
      rowStyle={({ dateOfDeath }) => {
        // Style rows for deceased patients red
        return dateOfDeath ? '& > td:not(:first-child) { color: #ed333a; }' : '';
      }}
      fetchOptions={fetchOptionsWithSearchParameters}
      endpoint={PATIENT_SEARCH_ENDPOINT}
    />
  );
};

const NewPatientButton = ({ onCreateNewPatient }) => {
  const { navigateToPatient } = usePatientNavigation();
  const [isCreatingPatient, setCreatingPatient] = useState(false);
  const dispatch = useDispatch();
  const hideModal = useCallback(() => setCreatingPatient(false), [setCreatingPatient]);

  const showNewPatient = useCallback(() => {
    setCreatingPatient(true);
  }, []);

  const handleCreateNewPatient = async newPatient => {
    setCreatingPatient(false);
    if (onCreateNewPatient) {
      onCreateNewPatient(newPatient.id);
    } else {
      await dispatch(reloadPatient(newPatient.id));
    }
    navigateToPatient(newPatient.id);
  };

  return (
    <>
      <ButtonWithPermissionCheck
        variant="outlined"
        color="primary"
        verb="create"
        noun="Patient"
        onClick={showNewPatient}
      >
        <TranslatedText stringId="patientListing.newPatientButton" fallback="+ Add new patient" />
      </ButtonWithPermissionCheck>
      <NewPatientModal
        title="New patient"
        open={isCreatingPatient}
        onCancel={hideModal}
        onCreateNewPatient={handleCreateNewPatient}
      />
    </>
  );
};

export const PatientListingView = ({ onViewPatient }) => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <PageContainer>
      <TopBar title={<TranslatedText stringId="patientListing.title" fallback="Patient listing" />}>
        <NewPatientButton onCreateNewPatient={onViewPatient} />
      </TopBar>
      <RecentlyViewedPatientsList />
      <ContentPane>
        <SearchTableTitle>
          <TranslatedText stringId="patientListing.tableTitle" fallback="Patient search" />
        </SearchTableTitle>
        <AllPatientsSearchBar onSearch={setSearchParameters} />
        <PatientTable
          onViewPatient={onViewPatient}
          fetchOptions={{ matchSecondaryIds: true }}
          searchParameters={{ isAllPatientsListing: true, ...searchParameters }}
          columns={LISTING_COLUMNS}
        />
      </ContentPane>
    </PageContainer>
  );
};

export const AdmittedPatientsView = () => {
  const { searchParameters, setSearchParameters } = usePatientSearch(
    PatientSearchKeys.AdmittedPatientsView,
  );
  const { facility } = useAuth();

  return (
    <PageContainer>
      <TopBar
        title={
          <TranslatedText
            stringId="patientListing.outpatientTitle"
            fallback="Admitted patient listing"
          />
        }
      />
      <RecentlyViewedPatientsList encounterType="admission" />
      <ContentPane>
        <SearchTableTitle>
          <TranslatedText stringId="patientListing.tableTitle" fallback="Patient search" />
        </SearchTableTitle>
        <PatientSearchBar onSearch={setSearchParameters} searchParameters={searchParameters} />
        <PatientTable
          fetchOptions={{ inpatient: 1 }}
          searchParameters={{ facilityId: facility.id, ...searchParameters }}
          columns={INPATIENT_COLUMNS}
        />
      </ContentPane>
    </PageContainer>
  );
};

export const OutpatientsView = () => {
  const { searchParameters, setSearchParameters } = usePatientSearch(
    PatientSearchKeys.OutpatientsView,
  );
  const { facility } = useAuth();

  return (
    <PageContainer>
      <TopBar
        title={
          <TranslatedText stringId="patientListing.outpatientTitle" fallback="Outpatient listing" />
        }
      />
      <RecentlyViewedPatientsList encounterType="clinic" />
      <ContentPane>
        <SearchTableTitle>
          <TranslatedText stringId="patientListing.tableTitle" fallback="Patient search" />
        </SearchTableTitle>
        <PatientSearchBar onSearch={setSearchParameters} searchParameters={searchParameters} />
        <PatientTable
          fetchOptions={{ outpatient: 1 }}
          searchParameters={{ facilityId: facility.id, ...searchParameters }}
          columns={INPATIENT_COLUMNS}
        />
      </ContentPane>
    </PageContainer>
  );
};
