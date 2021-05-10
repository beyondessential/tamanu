import React from 'react';
import { DateDisplay } from '../../components';
import { capitaliseFirstLetter } from '../../utils/capitalise';
import { CloudDownload, CloudOff } from '@material-ui/icons';

const DateOfBirthCell = React.memo(({ value }) => <DateDisplay date={value} />);
const SexCell = React.memo(({ value = '' }) => <span>{capitaliseFirstLetter(value)}</span>);
const SyncedCell = React.memo(({ value }) => value === true ? <CloudDownload /> : <CloudOff />);

export const getColumns = getFlag => {
  return {
    markedForSync: {
      key: 'markedForSync',
      title: 'Sync',
      minWidth: 26,
      CellComponent: SyncedCell,
    },

    displayId: {
      key: 'displayId',
      title: getFlag('patientFieldOverrides.displayId.shortLabel'),
      minWidth: 80,
      accessor: row => row.displayId || `(${row.id})`,
    },

    firstName: {
      key: 'firstName',
      title: 'First Name',
      minWidth: 100,
    },

    lastName: {
      key: 'lastName',
      title: 'Last Name',
      minWidth: 100,
    },

    culturalName: {
      key: 'culturalName',
      title: 'Cultural Name',
      minWidth: 100,
    },

    sex: {
      key: 'sex',
      title: 'Sex',
      minWidth: 80,
      CellComponent: SexCell,
    },

    dateOfBirth: {
      key: 'dateOfBirth',
      title: 'DOB',
      minWidth: 100,
      CellComponent: DateOfBirthCell,
    },

    village: {
      key: 'villageName',
      title: 'Village',
      minWidth: 100,
      accessor: row => row?.villageName || null,
    },

    location: {
      key: 'locationName',
      title: 'Location',
      minWidth: 100,
      accessor: row => row.locationName,
    },

    department: {
      key: 'departmentName',
      title: 'Department',
      minWidth: 100,
      accessor: row => row.departmentName,
    },

    status: {
      key: 'encounterType',
      title: 'Status',
      minWidth: 100,
      accessor: ({ encounterType }) => {
        if (!encounterType) return '';
        else if (encounterType === 'emergency') return 'Emergency';
        else if (encounterType === 'clinic') return 'Outpatient';
        return 'Inpatient';
      },
    },

    vaccinationStatus: {
      key: 'vaccinationStatus',
      title: 'Vaccine Status',
      minWidth: 100,
      accessor: row => row.vaccinationStatus || 'Unknown',
    },  
  };
};

