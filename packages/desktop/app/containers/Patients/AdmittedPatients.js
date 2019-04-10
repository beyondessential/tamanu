import React from 'react';
import { admittedPatientsColumns, headerStyle, columnStyle } from '../../constants';
import { PatientsCollection } from '../../collections';
import {
  TopBar, BrowsableTable, ButtonGroup, Button,
} from '../../components';

const patientsCollection = new PatientsCollection();

const addDischargeLink = (patientModel) => {
  const admission = patientModel.getCurrentAdmission();
  return {
    ...patientModel.toJSON(),
    dischargeLink: `/patients/visit/${patientModel.id}/${admission.id}`,
  };
};

const ActionsColumns = ({ original: { _id, dischargeLink } }) => (
  <ButtonGroup>
    <Button
      variant="outlined"
      to={`/patients/editPatient/${_id}`}
    >
      View Patient
    </Button>
    <Button
      variant="contained"
      color="primary"
      to={dischargeLink}
    >
      Discharge
    </Button>
  </ButtonGroup>
);

const getTableColumns = () => ([
  ...admittedPatientsColumns,
  {
    id: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 250,
    Cell: row => <ActionsColumns {...row} />,
  },
]);

export default function AdmittedPatients() {
  return (
    <React.Fragment>
      <TopBar
        title="Admitted Patients"
        button={{
          to: '/patients/edit/new',
          can: { do: 'create', on: 'patient' },
          children: 'New Patient',
        }}
      />
      <BrowsableTable
        collection={patientsCollection}
        columns={getTableColumns()}
        emptyNotification="No patients found."
        fetchOptions={{ admitted: true }}
        transformRow={addDischargeLink}
      />
    </React.Fragment>
  );
}
