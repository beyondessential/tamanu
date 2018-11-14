import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import WeekAppointment from './WeekAppointment';
import TodayAppointment from './TodayAppointment';
import SearchAppointment from './SearchAppointment';
import AppointmentsCalendar from './AppointmentsCalendar';
import Appointment from './Appointment';
import TheaterSchedule from './TheaterSchedule';
import ScheduleSurgery from './ScheduleSurgery';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={WeekAppointment} />
        <Route path={`${url}/today`} component={TodayAppointment} />
        <Route path={`${url}/search`} component={SearchAppointment} />
        <Route path={`${url}/calendar`} component={AppointmentsCalendar} />
        <Route path={`${url}/appointment/new`} component={Appointment} />
        <Route path={`${url}/appointment/:id`} component={Appointment} />
        <Route path={`${url}/theater`} component={TheaterSchedule} />
        <Route path={`${url}/edit/newsurgery`} component={ScheduleSurgery} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
