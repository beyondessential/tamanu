import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { capitalize } from 'lodash';
import { Grid } from '@material-ui/core';
import { patientAppointmentsColumns, dateFormat } from '../../../constants';
import { NewButton, EditButton, TabHeader, SimpleTable } from '../../../components';
import { PatientModel } from '../../../models';

export default class Appointments extends Component {
  static propTypes = {
    patientModel: PropTypes.instanceOf(PatientModel).isRequired,
  };

  state = {
    appointments: [],
    tableColumns: patientAppointmentsColumns,
  };

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  setActionsCol = row => (
    <div key={row.original._id}>
      <EditButton
        to={`/appointments/appointment/${row.original._id}`}
        size="small"
        can={{ do: 'update', on: 'appointment' }}
      />
    </div>
  );

  handleChange(props = this.props) {
    const { patient } = props;
    const { tableColumns } = this.state;
    const appointments = patient.appointments.map(appointment => {
      let { startDate, endDate, appointmentType } = appointment;
      if (startDate !== '') startDate = moment(startDate).format(`${dateFormat}`);
      if (endDate !== null) endDate = moment(endDate).format(`${dateFormat}`);
      appointmentType = capitalize(appointmentType);
      return {
        ...appointment,
        startDate,
        endDate,
        appointmentType,
      };
    });
    // Add actions column for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ appointments, tableColumns });
  }

  render() {
    const { patientModel } = this.props;
    const { appointments, tableColumns } = this.state;
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
            data={appointments}
            columns={tableColumns}
            emptyNotification="No appointments found."
          />
        </Grid>
      </Grid>
    );
  }
}
