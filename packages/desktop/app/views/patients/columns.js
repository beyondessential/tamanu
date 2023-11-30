import React from 'react';
import { CloudDownload, CloudOff } from '@material-ui/icons';
import { DateDisplay } from '../../components';
import { getPatientStatus } from '../../utils/getPatientStatus';
import { SexDisplay } from '../../components/Translation/SexDisplay';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const DateCell = React.memo(({ value }) => <DateDisplay date={value} />);
const SexCell = React.memo(({ value }) => <SexDisplay sex={value} />);
const SyncedCell = React.memo(({ value }) => (value === true ? <CloudDownload /> : <CloudOff />));

export const markedForSync = {
  key: 'markedForSync',
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
  minWidth: 80,
  CellComponent: SexCell,
  sortable: false,
};

export const dateOfBirth = {
  key: 'dateOfBirth',
  minWidth: 100,
  CellComponent: DateCell,
};

export const dateOfDeath = {
  key: 'dateOfDeath',
  minWidth: 100,
  CellComponent: DateCell,
};

export const village = {
  key: 'villageName',
  minWidth: 100,
  accessor: row => row?.villageName || null,
};

export const department = {
  key: 'departmentName',
  title: 'Department',
  minWidth: 100,
};

export const status = {
  key: 'patientStatus',
  title: 'Status',
  sortable: false,
  minWidth: 100,
  accessor: ({ dateOfDeath: dod, encounterType }) =>
    dod ? <strong>Deceased</strong> : getPatientStatus(encounterType),
};

export const clinician = {
  key: 'clinician',
  title: 'Clinician',
  sortable: false,
};

export const vaccinationStatus = {
  key: 'vaccinationStatus',
  title: 'Vaccine status',
  minWidth: 100,
  accessor: row => row.vaccinationStatus || 'Unknown',
};
