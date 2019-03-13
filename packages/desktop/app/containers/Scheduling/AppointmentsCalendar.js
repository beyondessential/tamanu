import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isEmpty, has, head, last } from 'lodash';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import actions from '../../actions/scheduling';
import FiltersForm from './components/FiltersForm';
import { REALM_DATE_FORMAT } from '../../constants';
import { TopBar } from '../../components';

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
    const { surgery } = this.props;
    this.props.history.push(`/appointments/${!surgery ? 'appointment' : 'surgery'}/${_id}`);
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
    const { surgery } = this.props;
    const {
      startDate,
      endDate,
      status,
      type,
      location,
      practitioner,
    } = this.state;

    const filters = {};
    if (startDate) filters.startDate = `>|${moment(startDate).startOf('day').format(REALM_DATE_FORMAT)}`;
    if (endDate) filters.endDate = `<|${moment(endDate).endOf('day').format(REALM_DATE_FORMAT)}`;
    if (status) filters.status = `LIKE|${status}`;
    if (type) filters.appointmentType = `LIKE|${type}`;
    if (location) filters.location = `CONTAINS[c]|${location}`;
    if (practitioner) filters.provider = `CONTAINS[c]|${practitioner}`;
    if (surgery) filters.appointmentType = 'surgery';
    this.props.fetchCalender({ filters });
  }

  render() {
    const { surgery } = this.props;
    const {
      appointments,
      loading,
      filtersOn,
    } = this.state;

    return (
      <div className="create-content">
        <TopBar
          title={!surgery ? 'Appointments Calendar': 'Theatre Schedule'}
          buttons={[{
            to: `/appointments/${surgery ? 'surgery' : 'appointment'}/new`,
            can: { do: 'create', on: 'appointment' },
            children: 'New Appointment'
          }, {
            variant: (filtersOn ? 'contained' : 'outlined'),
            color: 'secondary',
            children: 'Filters',
            onClick: () => this.setState({ filtersOn: !filtersOn }),
          }]}
        />
        <div className="create-container" >
          <div className="form with-padding">
            <FiltersForm
              surgery={surgery}
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
