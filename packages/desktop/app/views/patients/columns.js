import React from 'react';
import { pick } from 'lodash';
import { CloudDownload, CloudOff } from '@material-ui/icons';

import { DateDisplay } from '../../components';
import { capitaliseFirstLetter } from '../../utils/capitalise';

const DateOfBirthCell = React.memo(({ value }) => <DateDisplay date={value} />);
const SexCell = React.memo(({ value = '' }) => <span>{capitaliseFirstLetter(value)}</span>);
const SyncedCell = React.memo(({ value }) => value === true ? <CloudDownload /> : <CloudOff />);

export const getColumns = (getFlag, keys) => {
  const columns = [];
  for (const key of keys) {
    if (key === 'markedForSync') {
      columns.push({
        key,
        title: 'Sync',
        minWidth: 26,
        CellComponent: SyncedCell,
      });
    } else if (key === 'displayId') {
      columns.push({
        key,
        title: getFlag('patientFieldOverrides.displayId.shortLabel'),
        minWidth: 80,
        accessor: row => row.displayId || `(${row.id})`,
      });
    } else if (key === 'firstName') {
      columns.push({
        key,
        title: 'First Name',
        minWidth: 100,
      });
    } else if (key === 'lastName') {
      columns.push({
        key,
        title: 'Last Name',
        minWidth: 100,
      });
    } else if (key === 'culturalName') {
      columns.push({
        key,
        title: 'Cultural Name',
        minWidth: 100,
      });
    } else if (key === 'sex') {
      columns.push({
        key,
        title: 'Sex',
        minWidth: 80,
        CellComponent: SexCell,
      });
    } else if (key === 'dateOfBirth') {
      columns.push({
        key,
        title: 'DOB',
        minWidth: 100,
        CellComponent: DateOfBirthCell,
      });
    } else if (key === 'village') {
      columns.push({
        key,
        title: 'Village',
        minWidth: 100,
        accessor: row => row?.villageName || null,
      });
    } else if (key === 'location') {
      columns.push({
        key: 'locationName',
        title: 'Location',
        minWidth: 100,
        accessor: row => row.locationName,
      });
    } else if (key === 'department') {
      columns.push({
        key: 'departmentName',
        title: 'Department',
        minWidth: 100,
        accessor: row => row.departmentName,
      });
    } else if (key === 'status') {
      columns.push({
        key: 'encounterType',
        title: 'Status',
        minWidth: 100,
        accessor: ({ encounterType }) => {
          if (!encounterType) return '';
          else if (encounterType === 'emergency') return 'Emergency';
          else if (encounterType === 'clinic') return 'Outpatient';
          return 'Inpatient';
        },
      });
    } else if (key === 'vaccinationStatus') {
      columns.push({
        key,
        title: 'Vaccine Status',
        minWidth: 100,
        accessor: row => row.vaccinationStatus || 'Unknown',
      });
    } else {
      log.warn(`Unknown column key: ${key}`);
    }
  }
  return columns;
};

