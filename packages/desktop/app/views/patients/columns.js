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
  title: <ConfigurableText flag="patientFieldOverrides.displayId.shortLabel"/>,
  minWidth: 80,
  accessor: row => row.displayId || `(${row.id})`,
};

export const firstName = {
  key: 'firstName',
  title: <ConfigurableText flag="patientFieldOverrides.firstName.shortLabel"/>,
  minWidth: 100,
};

export const lastName = {
  key: 'lastName',
  title: <ConfigurableText flag="patientFieldOverrides.lastName.shortLabel"/>,
  minWidth: 100,
};

export const culturalName = {
  key: 'culturalName',
  title: <ConfigurableText flag="patientFieldOverrides.culturalName.shortLabel"/>,
  minWidth: 100,
};

export const sex = {
  key: 'sex',
  title: <ConfigurableText flag="patientFieldOverrides.sex.shortLabel"/>,
  minWidth: 80,
  CellComponent: SexCell,
};

export const dateOfBirth = {
  key: 'dateOfBirth',
  title: <ConfigurableText flag="patientFieldOverrides.dateOfBirth.shortLabel"/>,
  minWidth: 100,
  CellComponent: DateOfBirthCell,
};

export const village = {
  key: 'villageName',
  title: <ConfigurableText flag="patientFieldOverrides.villageName.shortLabel"/>,
  minWidth: 100,
  accessor: row => row?.villageName || null,
};

export const location = {
  key: 'locationName',
  title: <ConfigurableText flag="patientFieldOverrides.locationName.shortLabel"/>,
  minWidth: 100,
  accessor: row => row.locationName,
};

export const department = {
  key: 'departmentName',
  title: <ConfigurableText flag="patientFieldOverrides.departmentName.shortLabel"/>,
  minWidth: 100,
  accessor: row => row.departmentName,
};

export const status = {
  key: 'encounterType',
  title: <ConfigurableText flag="patientFieldOverrides.encounterType.shortLabel"/>,
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
  title: <ConfigurableText flag="patientFieldOverrides.vaccinationStatus.shortLabel"/>,
  minWidth: 100,
  accessor: row => row.vaccinationStatus || 'Unknown',
};

export const filterHiddenColumns =
  (columns, getFlag) => columns.filter(({ key }) => !getFlag(`patientFieldOverrides.${key}.hidden`));
