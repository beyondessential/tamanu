import React from 'react';
import { DateDisplay } from '../../components';
import { capitaliseFirstLetter } from '../../utils/capitalise';

const DateOfBirthCell = React.memo(({ value }) => <DateDisplay date={value} />);
const SexCell = React.memo(({ value = '' }) => <span>{capitaliseFirstLetter(value)}</span>);

export const displayId = {
  key: 'displayId',
  title: 'ID',
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
  accessor: row => row.villageName,
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
  key: 'visitType',
  title: 'Status',
  minWidth: 100,
  accessor: ({ visitType }) => {
    if (!visitType) return '';
    else if (visitType === 'emergency') return 'Emergency';
    else if (visitType === 'clinic') return 'Outpatient';
    return 'Inpatient';
  },
};
