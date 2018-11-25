import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import ReactTable from 'react-table';
import { isEmpty } from 'lodash';
import actions from '../../actions/scheduling';
import { appointmentsColumns, dbViews, pageSizes } from '../../constants';

import { Button } from '../../components/Button';

class TodaysAppointment extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.setActionsColumn = this.setActionsColumn.bind(this);
  }

  state = {
    appointments: [{}],
    loading: true,
    deleteModalVisible: false,
    selectedAppointment: null,
  }

  componentWillMount() {
    appointmentsColumns[appointmentsColumns.length - 1].Cell = this.setActionsColumn;
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { appointments, loading } = props;
    if (!loading) this.setState({ appointments, loading });
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => this.checkIn(row._id)}
        >
          Check In
        </Button>
        <Button 
          variant="outlined"
          onClick={() => this.goEdit(row._id)}
        >Edit</Button>
        <Button
          color="secondary"
          variant="outlined"
          onClick={() => this.showDeleteModal(row)}
        >Cancel</Button>
      </div>
    );
  }

  fetchData = opts => {
    this.props.fetchAppointments({
      view: dbViews.appointmentsToday,
      ...opts
    });
  }

  goEdit = (id) => {
    this.props.history.push(`/appointments/appointment/${id}`);
  }

  checkIn = (id) => {
    this.props.history.push(`/appointments/check-in/${id}`);
  }


  showDeleteModal = (appointment) => {
    this.setState({
      deleteModalVisible: true,
      selectedAppointment: appointment
    });
  }

  onCloseModal = () => {
    this.setState({ deleteModalVisible: false });
  }

  onDeleteAppointment = () => {
    let { selectedAppointment } = this.state;
    selectedAppointment = this.props.collection.findWhere({ _id: selectedAppointment._id });
    if (!isEmpty(selectedAppointment)) {
      selectedAppointment.destroy({
        wait: true,
        success: () => this.onCloseModal()
      });
    }
  }

  render() {
    const {
      loading,
      totalPages,
      appointments,
    } = this.state;

    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Today's Appointments
          </span>
          <div className="view-action-buttons">
            <Link to="/appointments/appointment/new">
              <i className="fa fa-plus" /> New Appointment
            </Link>
          </div>
        </div>
        <div className="detail">
          <ReactTable
            manual
            keyField="_id"
            data={appointments}
            pages={totalPages}
            defaultPageSize={pageSizes.appointments}
            loading={loading}
            columns={appointmentsColumns}
            className="-striped"
            defaultSortDirection="asc"
            onFetchData={this.fetchData}
          />
        </div>
        {/* <DeleteAppointmentModal
          isVisible={deleteModalVisible}
          onClose={this.onCloseModal}
          onDelete={this.onDeleteAppointment}
          little
        /> */}
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { appointments, totalPages, loading, error } = state.scheduling;
  return { appointments, totalPages, loading, error };
}

const { appointments: appointmentsActions } = actions;
const { fetchAppointments } = appointmentsActions;
const mapDispatchToProps = dispatch => ({
  fetchAppointments: (props) => dispatch(fetchAppointments(props)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TodaysAppointment);

