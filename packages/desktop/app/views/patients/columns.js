import React from 'react';
import { pick } from 'lodash';
import { CloudDownload, CloudOff } from '@material-ui/icons';

import { ConfigurableText, DateDisplay } from '../../components';
import { capitaliseFirstLetter } from '../../utils/capitalise';

const DateOfBirthCell = React.memo(({ value }) => <DateDisplay date={value} />);
const SexCell = React.memo(({ value = '' }) => <span>{capitaliseFirstLetter(value)}</span>);
const SyncedCell = React.memo(({ value }) => value === true ? <CloudDownload /> : <CloudOff />);

export const markedForSync = {
  key: 'markedForSync',
  minWidth: 26,
  CellComponent: SyncedCell,
};

export const displayId = {
  key: 'displayId',
  minWidth: 80,
  accessor: row => row.displayId || `(${row.id})`,
};

export const firstName = {
  key: 'firstName',
  minWidth: 100,
};

export const lastName = {
  key: 'lastName',
  minWidth: 100,
};

export const culturalName = {
  key: 'culturalName',
  minWidth: 100,
};

export const sex = {
  key: 'sex',
  minWidth: 80,
  CellComponent: SexCell,
};

export const dateOfBirth = {
  key: 'dateOfBirth',
  minWidth: 100,
  CellComponent: DateOfBirthCell,
};

export const village = {
  key: 'villageName',
  minWidth: 100,
  accessor: row => row?.villageName || null,
};

export const location = {
  key: 'locationName',
  minWidth: 100,
  accessor: row => row.locationName,
};

export const department = {
  key: 'departmentName',
  minWidth: 100,
  accessor: row => row.departmentName,
};

export const status = {
  key: 'encounterType',
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
  minWidth: 100,
  accessor: row => row.vaccinationStatus || 'Unknown',
};
