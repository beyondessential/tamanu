import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { isEmpty, has, head, last } from 'lodash';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import actions from '../../actions/scheduling';
import FiltersForm from './components/FiltersForm';
import { dbViews } from '../../constants';

import { ClearButton, FilterButton } from '../../components/Button';

BigCalendar.momentLocalizer(moment);

class AppointmentsCalendar extends Component {
  constructor(props) {
    super(props);
    this.setFilters = this.setFilters.bind(this);
    this.viewAppointment = this.viewAppointment.bind(this);
  }

  state = {
    appointments: [{}],
    loading: true,
    filtersOn: false,
    startDate: moment().startOf('month').subtract(2, 'weeks'),
    endDate: moment().endOf('month').add(2, 'weeks'),
    status: '',
    type: '',
    location: '',
    practitioner: '',
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { appointments, loading } = props;
    if (!loading) this.setState({ appointments, loading });
  }

  viewAppointment = ({ _id }) => {
    const { theatre } = this.props;
    this.props.history.push(`/appointments/${!theatre ? 'appointment' : 'surgery'}/${_id}`);
  }

  setDates = dates => {
    let startDate;
    let endDate;
    if (has(dates, 'start') && has(dates, 'end')) {
      startDate = moment(dates.start).startOf('day').toISOString();
      endDate = moment(dates.end).endOf('day').toISOString();
    } else if (!isEmpty(dates)) {
      startDate = moment(head(dates)).startOf('day').toISOString();
      endDate = moment(last(dates)).endOf('day').toISOString();
    }

    this.setState({ startDate, endDate }, this.fetchData);
  }

  setFilters = ({ status, type, practitioner, location }) => {
    this.setState({ status, type, practitioner, location }, this.fetchData);
  }

  fetchData = () => {
    const { theatre } = this.props;
    const {
      startDate,
      endDate,
      status,
      type,
      location,
      practitioner,
    } = this.state;
    let keys = [];
    let view = '';

    if (theatre) {
      keys = [ startDate, endDate, status, type, practitioner, location];
      view = dbViews.appointmentsSurgerySearch;
    } else {
      keys = [ startDate, endDate, status, practitioner, location];
      view = dbViews.appointmentsSearch;
    }

    this.props.fetchCalender({
      view, keys
    });
  }

  render() {
    const { theatre } = this.props;
    const {
      appointments,
      loading,
      filtersOn,
    } = this.state;

    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            {!theatre ? 'Appointments Calendar': 'Theatre Schedule'}
          </span>
          <div className="view-action-buttons p-t-10">
            <Button
              color="primary"
              variant='outlined'
              className="m-r-5"
              component={props => <Link to={`/appointments/${!theatre ? 'appointment' : 'surgery'}/new`} {...props} />}
            >
              <Icon className="fa fa-plus m-r-5" fontSize="inherit" /> New Appointment
            </Button>
            <Button
              color="primary"
              variant={filtersOn ? 'contained' : 'outlined'}
              onClick={() => this.setState({ filtersOn: !filtersOn })}
            >
              <Icon className="fa fa-filter m-r-5" fontSize="inherit" /> Filter
            </Button>
          </div>
        </div>
        <div className="create-container" >
          <div className="form with-padding">
            <FiltersForm
              theatre={theatre}
              loading={loading}
              collapse={filtersOn}
              onSubmit={this.setFilters}
            />
            <div className="columns">
              <div className="column">
                <div className="column calendar-height">
                  <BigCalendar
                    events={appointments}
                    onRangeChange={this.setDates}
                    onSelectEvent={this.viewAppointment}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { appointments, loading, error } = state.scheduling;
  return { appointments, loading, error };
}

const { appointments: appointmentsActions } = actions;
const { fetchCalender } = appointmentsActions;
const mapDispatchToProps = dispatch => ({
  fetchCalender: (props) => dispatch(fetchCalender(props)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppointmentsCalendar);
