import React from 'react';
import { CloudOff, CloudDone } from '@material-ui/icons';
import {
  DateDisplay,
  TranslatedReferenceData,
  TranslatedSex,
  TranslatedText,
} from '../../components';
import { getPatientStatus } from '../../utils/getPatientStatus';
import { ThemedTooltip } from '../../components/Tooltip';

const DateCell = React.memo(({ value }) => <DateDisplay date={value} data-test-id='datedisplay-3bzb' />);
export const SexCell = React.memo(({ value }) => <TranslatedSex sex={value} />);
const SyncedCell = React.memo(({ value }) =>
  value === true ? <CloudDone color="primary" /> : <CloudOff color="primary" />,
);

export const markedForSync = {
  key: 'markedForSync',
  title: (
    <TranslatedText
      stringId="general.localisedField.markedForSync.label.short"
      fallback="Sync"
      data-test-id='translatedtext-6fuj' />
  ),
  minWidth: 26,
  CellComponent: SyncedCell,
  sortable: false,
};

export const displayId = {
  key: 'displayId',
  title: <TranslatedText
    stringId="general.localisedField.displayId.label.short"
    fallback="NHN"
    data-test-id='translatedtext-tsit' />,
  minWidth: 80,
  accessor: row => row.displayId || `(${row.id})`,
};

export const firstName = {
  key: 'firstName',
  title: <TranslatedText
    stringId="general.localisedField.firstName.label"
    fallback="First name"
    data-test-id='translatedtext-k8ea' />,
  minWidth: 100,
};

export const lastName = {
  key: 'lastName',
  title: <TranslatedText
    stringId="general.localisedField.lastName.label"
    fallback="Last name"
    data-test-id='translatedtext-rbmv' />,
  minWidth: 100,
};

export const culturalName = {
  key: 'culturalName',
  title: (
    <TranslatedText
      stringId="general.localisedField.culturalName.label.short"
      fallback="Cultural name"
      data-test-id='translatedtext-8urf' />
  ),
  minWidth: 100,
};

export const sex = {
  key: 'sex',
  title: <TranslatedText
    stringId="general.localisedField.sex.label"
    fallback="Sex"
    data-test-id='translatedtext-fad7' />,
  minWidth: 80,
  CellComponent: SexCell,
  sortable: false,
};

export const dateOfBirth = {
  key: 'dateOfBirth',
  title: (
    <TranslatedText
      stringId="general.localisedField.dateOfBirth.label.short"
      fallback="DOB"
      data-test-id='translatedtext-16dy' />
  ),
  minWidth: 100,
  CellComponent: DateCell,
};

export const dateOfDeath = {
  key: 'dateOfDeath',
  title: (
    <TranslatedText
      stringId="general.localisedField.dateOfDeath.label.short"
      fallback="Death"
      data-test-id='translatedtext-tjo1' />
  ),
  minWidth: 100,
  CellComponent: DateCell,
};

export const village = {
  key: 'villageName',
  title: <TranslatedText
    stringId="general.localisedField.villageId.label"
    fallback="Village"
    data-test-id='translatedtext-kmbn' />,
  minWidth: 100,
  accessor: row => (
    <TranslatedReferenceData
      fallback={row.villageName ?? ''}
      value={row.villageId}
      category="village"
      data-test-id='translatedreferencedata-le9k' />
  ),
};

export const department = {
  key: 'departmentName',
  title: <TranslatedText
    stringId="general.department.label"
    fallback="Department"
    data-test-id='translatedtext-bvhk' />,
  minWidth: 100,
  accessor: row => (
    <TranslatedReferenceData
      fallback={row.departmentName ?? ''}
      value={row.departmentId}
      category="department"
      data-test-id='translatedreferencedata-475j' />
  ),
};

export const status = {
  key: 'patientStatus',
  title: <TranslatedText
    stringId="general.status.label"
    fallback="Status"
    data-test-id='translatedtext-ziu4' />,
  sortable: false,
  minWidth: 100,
  accessor: ({ dateOfDeath: dod, encounterType }) =>
    dod ? <strong>Deceased</strong> : getPatientStatus(encounterType),
};

export const clinician = {
  key: 'clinician',
  title: (
    <TranslatedText
      stringId="general.localisedField.clinician.label.short"
      fallback="Clinician"
      data-test-id='translatedtext-8z1p' />
  ),
  sortable: false,
};

export const vaccinationStatus = {
  key: 'vaccinationStatus',
  title: <TranslatedText
    stringId="vaccine.status.label"
    fallback="Vaccine status"
    data-test-id='translatedtext-jt8j' />,
  minWidth: 100,
  accessor: row => row.vaccinationStatus || 'Unknown',
};

export const diet = {
  key: 'diets',
  title: <TranslatedText
    stringId="general.diet.label"
    fallback="Diet"
    data-test-id='translatedtext-jv3s' />,
  accessor: ({ diets }) => {
    if (!diets?.length) return null;
    const dietNames = diets.map(diet => diet.name);
    const dietCodes = diets.map(diet => diet.code);
    return (
      <ThemedTooltip title={dietNames.join(', ')}>
        <span>{dietCodes.join(', ')}</span>
      </ThemedTooltip>
    );
  },
};

export const inpatientSex = {
  key: 'sex',
  title: <TranslatedText
    stringId="general.localisedField.sex.label"
    fallback="Sex"
    data-test-id='translatedtext-nv0f' />,
  accessor: ({ sex }) => {
    if (!sex) return null;
    return sex.charAt(0).toUpperCase();
  },
};
