import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { LocationCell, LocationGroupCell } from '../../components/LocationCell';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { reloadPatient } from '../../store/patient';
import {
  AllPatientsSearchBar,
  ContentPane,
  PageContainer,
  PatientSearchBar,
  SearchTableTitle,
  SearchTableWithPermissionCheck,
  TopBar,
} from '../../components';
import { RecentlyViewedPatientsList } from '../../components/RecentlyViewedPatientsList';
import { ButtonWithPermissionCheck } from '@tamanu/ui-components';
import { NewPatientModal } from './components';
import {
  clinician,
  culturalName,
  dateOfBirth,
  department,
  diet,
  displayId,
  inpatientSex,
  firstName,
  lastName,
  markedForSync,
  sex,
  status,
  village,
} from './columns';
import { useAuth } from '../../contexts/Auth';
import { PatientSearchKeys, usePatientSearch } from '../../contexts/PatientSearch';
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
  title: (
    <TranslatedText
      stringId="general.location.label"
      fallback="Location"
      data-testid="translatedtext-1hhe"
    />
  ),
  accessor: LocationCell,
};

const locationGroup = {
  key: 'locationGroupName',
  title: (
    <TranslatedText
      stringId="general.area.label"
      fallback="Area"
      data-testid="translatedtext-28c6"
    />
  ),
  accessor: LocationGroupCell,
};

const OUTPATIENT_COLUMNS = [markedForSync, displayId, firstName, lastName, dateOfBirth, sex].concat(
  [locationGroup, location, department, clinician].map((column) => ({
    ...column,
    sortable: false,
  })),
);

const INPATIENT_COLUMNS = [displayId, firstName, lastName, dateOfBirth, inpatientSex].concat(
  [locationGroup, location, department, clinician, diet].map((column) => ({
    ...column,
    sortable: false,
  })),
);

const PatientTable = ({ columns, fetchOptions, searchParameters }) => {
  const { navigateToPatient } = usePatientNavigation();
  const dispatch = useDispatch();
  const { facilityId } = useAuth();
  const fetchOptionsWithSearchParameters = {
    ...searchParameters,
    ...fetchOptions,
    facilityId,
  };

  const handleViewPatient = async (row) => {
    await dispatch(reloadPatient(row.id));
    navigateToPatient(row.id);
  };

  return (
    <SearchTableWithPermissionCheck
      verb="list"
      noun="Patient"
      columns={columns}
      noDataMessage="No patients found"
      onRowClick={handleViewPatient}
      rowStyle={({ dateOfDeath }) => {
        // Style rows for deceased patients red
        return dateOfDeath ? '& > td:not(:first-child) { color: #ed333a; }' : '';
      }}
      fetchOptions={fetchOptionsWithSearchParameters}
      endpoint={PATIENT_SEARCH_ENDPOINT}
      data-testid="searchtablewithpermissioncheck-qyht"
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

  const handleCreateNewPatient = async (newPatient) => {
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
        data-testid="buttonwithpermissioncheck-itoq"
      >
        +{'\u00A0'}
        <TranslatedText
          stringId="patientList.action.add"
          fallback="Add new patient"
          data-testid="translatedtext-x0v7"
        />
      </ButtonWithPermissionCheck>
      <NewPatientModal
        title="New patient"
        open={isCreatingPatient}
        onCancel={hideModal}
        onCreateNewPatient={handleCreateNewPatient}
        data-testid="newpatientmodal-za1g"
      />
    </>
  );
};

export const PatientListingView = ({ onViewPatient }) => {
  const [searchParameters, setSearchParameters] = useState({});

  const { facilityId } = useAuth();

  return (
    <PageContainer data-testid="pagecontainer-bbim">
      <TopBar
        title={
          <TranslatedText
            stringId="patientList.default.title"
            fallback="Patient listing"
            data-testid="translatedtext-sjbd"
          />
        }
        data-testid="topbar-asng"
      >
        <NewPatientButton onCreateNewPatient={onViewPatient} data-testid="newpatientbutton-dnh4" />
      </TopBar>
      <RecentlyViewedPatientsList data-testid="recentlyviewedpatientslist-oe2h" />
      <ContentPane data-testid="contentpane-2462">
        <SearchTableTitle data-testid="searchtabletitle-bxti">
          <TranslatedText
            stringId="patientList.search.title"
            fallback="Patient search"
            data-testid="translatedtext-6znv"
          />
        </SearchTableTitle>
        <AllPatientsSearchBar
          onSearch={setSearchParameters}
          data-testid="allpatientssearchbar-f491"
        />
        <PatientTable
          onViewPatient={onViewPatient}
          fetchOptions={{ matchSecondaryIds: true }}
          searchParameters={{ isAllPatientsListing: true, facilityId, ...searchParameters }}
          columns={LISTING_COLUMNS}
          data-testid="patienttable-l8c2"
        />
      </ContentPane>
    </PageContainer>
  );
};

export const AdmittedPatientsView = () => {
  const { searchParameters, setSearchParameters } = usePatientSearch(
    PatientSearchKeys.AdmittedPatientsView,
  );
  const { facilityId } = useAuth();

  return (
    <PageContainer data-testid="pagecontainer-w0m4">
      <TopBar
        title={
          <TranslatedText
            stringId="patientList.inpatient.title"
            fallback="Admitted patient listing"
            data-testid="translatedtext-ia8g"
          />
        }
        data-testid="topbar-7iok"
      />
      <RecentlyViewedPatientsList
        encounterType="admission"
        data-testid="recentlyviewedpatientslist-x5ge"
      />
      <ContentPane data-testid="contentpane-1uj0">
        <SearchTableTitle data-testid="searchtabletitle-v9md">
          <TranslatedText
            stringId="patientList.search.title"
            fallback="Patient search"
            data-testid="translatedtext-6yf6"
          />
        </SearchTableTitle>
        <PatientSearchBar
          onSearch={setSearchParameters}
          searchParameters={searchParameters}
          isInpatient
          data-testid="patientsearchbar-0j57"
        />
        <PatientTable
          fetchOptions={{ inpatient: 1 }}
          searchParameters={{ facilityId, ...searchParameters }}
          columns={INPATIENT_COLUMNS}
          data-testid="patienttable-w4sz"
        />
      </ContentPane>
    </PageContainer>
  );
};

export const OutpatientsView = () => {
  const { searchParameters, setSearchParameters } = usePatientSearch(
    PatientSearchKeys.OutpatientsView,
  );
  const { facilityId } = useAuth();

  return (
    <PageContainer data-testid="pagecontainer-4smw">
      <TopBar
        title={
          <TranslatedText
            stringId="patientList.outpatient.title"
            fallback="Outpatient listing"
            data-testid="translatedtext-23gz"
          />
        }
        data-testid="topbar-a2n3"
      />
      <RecentlyViewedPatientsList
        encounterType="clinic"
        data-testid="recentlyviewedpatientslist-ymdi"
      />
      <ContentPane data-testid="contentpane-szs6">
        <SearchTableTitle data-testid="searchtabletitle-09n6">
          <TranslatedText
            stringId="patientList.search.title"
            fallback="Patient search"
            data-testid="translatedtext-zx9n"
          />
        </SearchTableTitle>
        <PatientSearchBar
          onSearch={setSearchParameters}
          searchParameters={searchParameters}
          data-testid="patientsearchbar-rk17"
        />
        <PatientTable
          fetchOptions={{ outpatient: 1 }}
          searchParameters={{ facilityId, ...searchParameters }}
          columns={OUTPATIENT_COLUMNS}
          data-testid="patienttable-18bx"
        />
      </ContentPane>
    </PageContainer>
  );
};
