import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { capitalize } from 'lodash';
import { patientAppointmentsColumns, dateFormat } from '../../../constants';
import { NewButton, EditButton } from '../../../components';

class Appointments extends Component {
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

  handleChange(props = this.props) {
    const { patient } = props;
    const { tableColumns } = this.state;
    const appointments = patient.appointments.map(appointment => {
      let { startDate, endDate, appointmentType } = appointment;
      if (startDate !== '') startDate = moment(startDate).format(`${dateFormat}`);
      if (endDate !== null) endDate = moment(endDate).format(`${dateFormat}`);
      appointmentType = capitalize(appointmentType);
      return {
        ...appointment, startDate, endDate, appointmentType,
      };
    });
    // Add actions column for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ appointments, tableColumns });
  }

  setActionsCol = (row) => (
    <div key={row.original._id}>
      <EditButton
        to={`/appointments/appointment/${row.original._id}`}
        size="small"
        can={{ do: 'update', on: 'appointment' }}
      />
    </div>
  )

  render() {
    const { patientModel } = this.props;
    const { appointments, tableColumns } = this.state;
    return (
      <div>
        <div className="column p-t-0 p-b-0">
          <NewButton
            className="is-pulled-right"
            to={`/appointments/appointmentByPatient/${patientModel.id}`}
            can={{ do: 'create', on: 'appointment' }}
          >
New Appointment
          </NewButton>
          <div className="is-clearfix" />
        </div>
        <div className="column">
          {appointments.length > 0
            && (
            <div>
              <ReactTable
                keyField="_id"
                data={appointments}
                pageSize={appointments.length}
                columns={tableColumns}
                className="-striped"
                defaultSortDirection="asc"
                showPagination={false}
              />
            </div>
            )
          }
          {appointments.length === 0
            && (
            <div className="notification">
              <span>
                No appointments found.
              </span>
            </div>
            )
          }
        </div>
      </div>
    );
  }
}

export default Appointments;
