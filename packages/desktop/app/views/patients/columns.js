import React from 'react';
import { DateDisplay } from '../../components';
const DateOfBirthCell = React.memo(({ value }) => <DateDisplay date={value} />);
const SexCell = React.memo(({ value = "" }) => <span>{ value.slice(0, 1).toUpperCase() + value.slice(1) }</span>);

export const displayId = {
  key: 'displayId',
  title: 'ID',
  minWidth: 80,
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
};
