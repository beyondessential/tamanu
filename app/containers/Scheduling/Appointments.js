import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { isEmpty } from 'lodash';
import AppointmentsTable from './components/AppointmentsTable';
import { Preloader } from '../../components';

class Appointments extends Component {
  state = {
    keys: [],
  }

  componentDidMount() {
    const { today } = this.props;
    const period = today ? 'day' : 'week';
    const keys = [
      moment().startOf(period).toISOString(), // start date
      moment().endOf(period).toISOString() // end date
    ];
    this.setState({ keys }, () => this.forceUpdate) ;
  }

  render() {
    const { today } = this.props;
    const { keys } = this.state;
    if (isEmpty(keys)) {
      return <Preloader />;
    }
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            {today ? "Today's Appointments" : "Appointments This Week"}
          </span>
          <div className="view-action-buttons">
            <Link to="/appointments/appointment/new">
              <i className="fa fa-plus" /> New Appointment
            </Link>
          </div>
        </div>
        <AppointmentsTable
          keys={keys}
          history={this.props.history}
          autoFetch
        />
      </div>
    );
  }
}

export default Appointments;

