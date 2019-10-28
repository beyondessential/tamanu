import React from 'react';
import { DateDisplay } from '../../components';
import { capitaliseFirstLetter } from '../../utils/capitalise';

import { getCurrentVisit } from '../../store/patient';

const DateOfBirthCell = React.memo(({ value }) => <DateDisplay date={value} />);
const SexCell = React.memo(({ value = '' }) => (
  <span>{capitaliseFirstLetter(value)}</span>
));

export const displayId = {
  key: 'displayId',
  title: 'ID',
  minWidth: 80,
  accessor: row => row.displayId || `(${row._id})`,
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

export const location = {
  key: 'location',
  title: 'Location',
  minWidth: 100,
  accessor: (row) => {
    const visit = getCurrentVisit(row);
    return visit && visit.location && visit.location.name;
  }
};

export const department = {
  key: 'department',
  title: 'Department',
  minWidth: 100,
  accessor: (row) => {
    const visit = getCurrentVisit(row);
    return visit && visit.department && visit.department.name;
  }
};

export const status = {
  key: 'status',
  title: 'Status',
  minWidth: 100,
  accessor: row => {
    const visit = getCurrentVisit(row);
    if (!visit) return '';
    else if (visit.visitType === 'emergency') return 'Emergency';
    // TODO: include "Outpatient" status
    return 'Inpatient';
  },
};

