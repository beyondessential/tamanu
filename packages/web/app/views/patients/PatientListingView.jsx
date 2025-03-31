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
import { ButtonWithPermissionCheck } from '../../components/Button';
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
  title: <TranslatedText
    stringId="general.location.label"
    fallback="Location"
    data-testid='translatedtext-obtz' />,
  accessor: LocationCell,
};

const locationGroup = {
  key: 'locationGroupName',
  title: <TranslatedText
    stringId="general.area.label"
    fallback="Area"
    data-testid='translatedtext-lt6f' />,
  accessor: LocationGroupCell,
};

const OUTPATIENT_COLUMNS = [markedForSync, displayId, firstName, lastName, dateOfBirth, sex].concat(
  [locationGroup, location, department, clinician].map(column => ({
    ...column,
    sortable: false,
  })),
);

const INPATIENT_COLUMNS = [displayId, firstName, lastName, dateOfBirth, inpatientSex].concat(
  [locationGroup, location, department, clinician, diet].map(column => ({
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

  const handleViewPatient = async row => {
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
        data-testid='buttonwithpermissioncheck-6ajy'>
        +{'\u00A0'}
        <TranslatedText
          stringId="patientList.action.add"
          fallback="Add new patient"
          data-testid='translatedtext-1lsh' />
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

  const { facilityId } = useAuth();

  return (
    <PageContainer>
      <TopBar
        title={<TranslatedText
          stringId="patientList.default.title"
          fallback="Patient listing"
          data-testid='translatedtext-enlo' />}
        data-testid='topbar-kzet'>
        <NewPatientButton onCreateNewPatient={onViewPatient} />
      </TopBar>
      <RecentlyViewedPatientsList />
      <ContentPane>
        <SearchTableTitle>
          <TranslatedText
            stringId="patientList.search.title"
            fallback="Patient search"
            data-testid='translatedtext-ke7c' />
        </SearchTableTitle>
        <AllPatientsSearchBar onSearch={setSearchParameters} />
        <PatientTable
          onViewPatient={onViewPatient}
          fetchOptions={{ matchSecondaryIds: true }}
          searchParameters={{ isAllPatientsListing: true, facilityId, ...searchParameters }}
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
  const { facilityId } = useAuth();

  return (
    <PageContainer>
      <TopBar
        title={
          <TranslatedText
            stringId="patientList.inpatient.title"
            fallback="Admitted patient listing"
            data-testid='translatedtext-o45o' />
        }
        data-testid='topbar-pgre' />
      <RecentlyViewedPatientsList encounterType="admission" />
      <ContentPane>
        <SearchTableTitle>
          <TranslatedText
            stringId="patientList.search.title"
            fallback="Patient search"
            data-testid='translatedtext-lswm' />
        </SearchTableTitle>
        <PatientSearchBar
          onSearch={setSearchParameters}
          searchParameters={searchParameters}
          isInpatient
        />
        <PatientTable
          fetchOptions={{ inpatient: 1 }}
          searchParameters={{ facilityId, ...searchParameters }}
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
  const { facilityId } = useAuth();

  return (
    <PageContainer>
      <TopBar
        title={
          <TranslatedText
            stringId="patientList.outpatient.title"
            fallback="Outpatient listing"
            data-testid='translatedtext-vxhr' />
        }
        data-testid='topbar-pf3x' />
      <RecentlyViewedPatientsList encounterType="clinic" />
      <ContentPane>
        <SearchTableTitle>
          <TranslatedText
            stringId="patientList.search.title"
            fallback="Patient search"
            data-testid='translatedtext-rioa' />
        </SearchTableTitle>
        <PatientSearchBar onSearch={setSearchParameters} searchParameters={searchParameters} />
        <PatientTable
          fetchOptions={{ outpatient: 1 }}
          searchParameters={{ facilityId, ...searchParameters }}
          columns={OUTPATIENT_COLUMNS}
        />
      </ContentPane>
    </PageContainer>
  );
};
