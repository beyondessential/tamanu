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

const DateCell = React.memo(({ value }) => <DateDisplay date={value} />);
export const SexCell = React.memo(({ value }) => <TranslatedSex sex={value} />);
const SyncedCell = React.memo(({ value }) =>
  value === true ? <CloudDone color="primary" /> : <CloudOff color="primary" />,
);

export const markedForSync = {
  key: 'markedForSync',
  title: (
    <TranslatedText stringId="general.localisedField.markedForSync.label.short" fallback="Sync" />
  ),
  minWidth: 26,
  CellComponent: SyncedCell,
  sortable: false,
};

export const displayId = {
  key: 'displayId',
  title: <TranslatedText stringId="general.localisedField.displayId.label.short" fallback="NHN" />,
  minWidth: 80,
  accessor: row => row.displayId || `(${row.id})`,
};

export const firstName = {
  key: 'firstName',
  title: <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />,
  minWidth: 100,
};

export const lastName = {
  key: 'lastName',
  title: <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />,
  minWidth: 100,
};

export const culturalName = {
  key: 'culturalName',
  title: (
    <TranslatedText
      stringId="general.localisedField.culturalName.label.short"
      fallback="Cultural name"
    />
  ),
  minWidth: 100,
};

export const sex = {
  key: 'sex',
  title: <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />,
  minWidth: 80,
  CellComponent: SexCell,
  sortable: false,
};

export const dateOfBirth = {
  key: 'dateOfBirth',
  title: (
    <TranslatedText stringId="general.localisedField.dateOfBirth.label.short" fallback="DOB" />
  ),
  minWidth: 100,
  CellComponent: DateCell,
};

export const dateOfDeath = {
  key: 'dateOfDeath',
  title: (
    <TranslatedText stringId="general.localisedField.dateOfDeath.label.short" fallback="Death" />
  ),
  minWidth: 100,
  CellComponent: DateCell,
};

export const village = {
  key: 'villageName',
  title: <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
  minWidth: 100,
  accessor: row => (
    <TranslatedReferenceData
      fallback={row.villageName ?? ''}
      value={row.villageId}
      category="village"
    />
  ),
};

export const department = {
  key: 'departmentName',
  title: <TranslatedText stringId="general.department.label" fallback="Department" />,
  minWidth: 100,
  accessor: row => (
    <TranslatedReferenceData
      fallback={row.departmentName ?? ''}
      value={row.departmentId}
      category="department"
    />
  ),
};

export const status = {
  key: 'patientStatus',
  title: <TranslatedText stringId="general.status.label" fallback="Status" />,
  sortable: false,
  minWidth: 100,
  accessor: ({ dateOfDeath: dod, encounterType }) =>
    dod ? <strong>Deceased</strong> : getPatientStatus(encounterType),
};

export const clinician = {
  key: 'clinician',
  title: (
    <TranslatedText stringId="general.localisedField.clinician.label.short" fallback="Clinician" />
  ),
  sortable: false,
};

export const vaccinationStatus = {
  key: 'vaccinationStatus',
  title: <TranslatedText stringId="vaccine.status.label" fallback="Vaccine status" />,
  minWidth: 100,
  accessor: row => row.vaccinationStatus || 'Unknown',
};

export const diet = {
  key: 'diets',
  title: <TranslatedText stringId="general.diet.label" fallback="Diet" />,
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
  title: <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />,
  accessor: ({ sex }) => {
    if (!sex) return null;
    return sex.charAt(0).toUpperCase();
  },
};
