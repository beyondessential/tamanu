import React from 'react';
import { pick } from 'lodash';
import { CloudDownload, CloudOff } from '@material-ui/icons';

import { ConfigurableText, DateDisplay } from '../../components';
import { capitaliseFirstLetter } from '../../utils/capitalise';

const DateOfBirthCell = React.memo(({ value }) => <DateDisplay date={value} />);
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

export const sexName = {
  key: 'sexName',
  minWidth: 80,
};

export const dateOfBirth = {
  key: 'dateOfBirth',
  minWidth: 100,
  CellComponent: DateOfBirthCell,
};

export const village = {
  key: 'villageName',
  minWidth: 100,
};

export const location = {
  key: 'locationName',
  title: 'Location',
  minWidth: 100,
};

export const department = {
  key: 'departmentName',
  title: 'Department',
  minWidth: 100,
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
  title: 'Vaccine status',
  minWidth: 100,
  accessor: row => row.vaccinationStatus || 'Unknown',
};
