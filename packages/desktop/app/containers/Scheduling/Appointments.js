import React, { Component } from 'react';
import moment from 'moment';
import { isEmpty } from 'lodash';

import AppointmentsTable from './components/AppointmentsTable';
import { Preloader, TopBar  } from '../../components';


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
        <TopBar
          title={today ? "Today's Appointments" : "Appointments This Week"}
          buttons={{
            to: "/appointments/appointment/new",
            can: { do: 'create', on: 'appointment' },
            children: 'New Appointment'
          }}
        />
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

