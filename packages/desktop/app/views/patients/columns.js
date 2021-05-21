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
  title: 'Sync',
  minWidth: 26,
  CellComponent: SyncedCell,
};

export const displayId = {
  key: 'displayId',
  title: <ConfigurableText flag="fields.displayId.shortLabel"/>,
  minWidth: 80,
  accessor: row => row.displayId || `(${row.id})`,
};

export const firstName = {
  key: 'firstName',
  title: <ConfigurableText flag="fields.firstName.shortLabel"/>,
  minWidth: 100,
};

export const lastName = {
  key: 'lastName',
  title: <ConfigurableText flag="fields.lastName.shortLabel"/>,
  minWidth: 100,
};

export const culturalName = {
  key: 'culturalName',
  title: <ConfigurableText flag="fields.culturalName.shortLabel"/>,
  minWidth: 100,
};

export const sex = {
  key: 'sex',
  title: <ConfigurableText flag="fields.sex.shortLabel"/>,
  minWidth: 80,
  CellComponent: SexCell,
};

export const dateOfBirth = {
  key: 'dateOfBirth',
  title: <ConfigurableText flag="fields.dateOfBirth.shortLabel"/>,
  minWidth: 100,
  CellComponent: DateOfBirthCell,
};

export const village = {
  key: 'villageName',
  title: <ConfigurableText flag="fields.villageName.shortLabel"/>,
  minWidth: 100,
  accessor: row => row?.villageName || null,
};

export const location = {
  key: 'locationName',
  title: <ConfigurableText flag="fields.locationName.shortLabel"/>,
  minWidth: 100,
  accessor: row => row.locationName,
};

export const department = {
  key: 'departmentName',
  title: <ConfigurableText flag="fields.departmentName.shortLabel"/>,
  minWidth: 100,
  accessor: row => row.departmentName,
};

export const status = {
  key: 'encounterType',
  title: <ConfigurableText flag="fields.encounterType.shortLabel"/>,
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
  title: <ConfigurableText flag="fields.vaccinationStatus.shortLabel"/>,
  minWidth: 100,
  accessor: row => row.vaccinationStatus || 'Unknown',
};

export const filterHiddenColumns =
  (columns, getFlag) => columns.filter(({ key }) => !getFlag(`fields.${key}.hidden`));
