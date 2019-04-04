import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import {
  Button, NewButton, TabHeader, SimpleTable,
} from '../../../components';
import {
  patientImagingRequestsColumns as tableColumns,
  headerStyle, columnStyle,
} from '../../../constants';
import { PatientModel } from '../../../models';

const getTableColumns = () => ([
  ...tableColumns,
  {
    id: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 250,
    Cell: (row) => <ActionsColumn {...row} />,
  },
]);

const ActionsColumn = ({ original: { _id } }) => (
  <Button
    key={_id}
    variant="contained"
    color="primary"
    to={`/imaging/request/${_id}`}
  >
    View
  </Button>
);

export default function Imaging({ patientModel }) {
  const imagingRequests = patientModel.getImagingRequests();
  return (
    <Grid container>
      <TabHeader>
        <NewButton
          to={`/appointments/appointmentByPatient/${patientModel.id}`}
          can={{ do: 'create', on: 'appointment' }}
        >
          New Appointment
        </NewButton>
      </TabHeader>
      <Grid container item>
        <SimpleTable
          data={imagingRequests}
          columns={getTableColumns()}
          emptyNotification="No imaging requests found."
        />
      </Grid>
    </Grid>
  );
}

Imaging.propTypes = {
  patientModel: PropTypes.instanceOf(PatientModel).isRequired,
};
