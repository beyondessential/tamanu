import React from 'react';
import { pick } from 'lodash';
import { CloudDownload, CloudOff } from '@material-ui/icons';

import { DateDisplay } from '../../components';
import { capitaliseFirstLetter } from '../../utils/capitalise';

const DateOfBirthCell = React.memo(({ value }) => <DateDisplay date={value} />);
const SexCell = React.memo(({ value = '' }) => <span>{capitaliseFirstLetter(value)}</span>);
const SyncedCell = React.memo(({ value }) => value === true ? <CloudDownload /> : <CloudOff />);

export const markedForSync = {
  key: 'markedForSync',
  title: 'Sync',
  minWidth: 26,
  CellComponent: SyncedCell,
};

export const displayId = {
  key: 'displayId',
  title: () => (
    <ConfigurableText key="patientFieldOverrides.displayId.shortLabel"/>
  ),
  minWidth: 80,
  accessor: row => row.displayId || `(${row.id})`,
};

export const firstName = {
  key: 'firstName',
  title: 'First Name',
  minWidth: 100,
};

export const lastName = {
  key: 'lastName',
  title: 'Last Name',
  minWidth: 100,
};

export const culturalName = {
  key: 'culturalName',
  title: 'Cultural Name',
  minWidth: 100,
};

export const sex = {
  key: 'sex',
  title: 'Sex',
  minWidth: 80,
  CellComponent: SexCell,
};

export const dateOfBirth = {
  key: 'dateOfBirth',
  title: 'DOB',
  minWidth: 100,
  CellComponent: DateOfBirthCell,
};

export const village = {
  key: 'villageName',
  title: 'Village',
  minWidth: 100,
  accessor: row => row?.villageName || null,
};

export const location = {
  key: 'locationName',
  title: 'Location',
  minWidth: 100,
  accessor: row => row.locationName,
};

export const department = {
  key: 'departmentName',
  title: 'Department',
  minWidth: 100,
  accessor: row => row.departmentName,
};

export const status = {
  key: 'encounterType',
  title: 'Status',
  minWidth: 100,
  accessor: ({ encounterType }) => {
    if (!encounterType) return '';
    else if (encounterType === 'emergency') return 'Emergency';
    else if (encounterType === 'clinic') return 'Outpatient';
    return 'Inpatient';
  },
};

export const vaccinationStatus = {
  key: 'vaccinationStatus',
  title: 'Vaccine Status',
  minWidth: 100,
  accessor: row => row.vaccinationStatus || 'Unknown',
};
