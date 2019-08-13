import React from 'react';
import { TopBar, DataFetchingTable, DateDisplay } from '../../components';

const DateOfBirthCell = React.memo(value => <DateDisplay date={value} />);
const COLUMNS = [
  {
    key: 'displayId',
    title: 'Id',
    minWidth: 80,
  },
  {
    key: 'location',
    title: 'Location',
    minWidth: 100,
  },
  {
    key: 'firstName',
    title: 'First Name',
    minWidth: 100,
  },
  {
    key: 'lastName',
    title: 'Last Name',
    minWidth: 100,
  },
  {
    key: 'sex',
    title: 'Sex',
    minWidth: 80,
  },
  {
    key: 'dateOfBirth',
    CellComponent: DateOfBirthCell,
    title: 'DOB',
    minWidth: 100,
  },
];

export const AdmittedPatients = React.memo(() => (
  <React.Fragment>
    <TopBar title="Admitted Patients" />
    <DataFetchingTable
      endpoint="patient"
      columns={COLUMNS}
      noDataMessage="No patients found."
      fetchOptions={{ admitted: true }}
      noDataMessage="No admitted patients match your search"
    />
  </React.Fragment>
));
