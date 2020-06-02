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
  key: 'village_name',
  title: 'Village',
  minWidth: 100,
  accessor: row => row.village_name,
};

export const location = {
  key: 'location_name',
  title: 'Location',
  minWidth: 100,
  accessor: row => row.location_name,
};

export const department = {
  key: 'department_name',
  title: 'Department',
  minWidth: 100,
  accessor: row => row.department_name,
};

export const status = {
  key: 'status',
  title: 'Status',
  minWidth: 100,
  accessor: ({ visit_type }) => {
    if (!visit_type) return '';
    else if (visit_type === 'emergency') return 'Emergency';
    else if (visit_type === 'clinic') return 'Outpatient';
    return 'Inpatient';
  },
};
