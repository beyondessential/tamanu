import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import Appointments from './Appointments';
import TodayAppointments from './TodayAppointments';
import SearchAppointment from './SearchAppointment';
import AppointmentsCalendar from './AppointmentsCalendar';
import Appointment from './Appointment';
import TheaterSchedule from './TheaterSchedule';
import SurgeryAppointment from './SurgeryAppointment';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Appointments} />
        <Route path={`${url}/week`} component={Appointments} />
        <Route path={`${url}/today`} component={TodayAppointments} />
        <Route path={`${url}/search`} component={SearchAppointment} />
        <Route path={`${url}/calendar`} component={AppointmentsCalendar} />
        <Route path={`${url}/appointment/new`} component={Appointment} />
        <Route path={`${url}/appointment/:id`} component={Appointment} />
        <Route path={`${url}/theater`} component={TheaterSchedule} />
        <Route path={`${url}/surgery/new`} component={SurgeryAppointment} />
        <Route path={`${url}/surgery/:id`} component={SurgeryAppointment} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
