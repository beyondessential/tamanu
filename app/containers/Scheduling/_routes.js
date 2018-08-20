import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import NotActive from '../NotActive';
import WeekAppointment from './WeekAppointment';
import TodayAppointment from './TodayAppointment';
import SearchAppointment from './SearchAppointment';
import AppointmentsCalendar from './AppointmentsCalendar';
import AddAppointment from './AddAppointment';
import TheaterSchedule from './TheaterSchedule';
import ScheduleSurgery from './ScheduleSurgery';
import EditAppointment from './EditAppointment';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={NotActive} />
        <Route path={`${url}/today`} component={NotActive} />
        <Route path={`${url}/search`} component={NotActive} />
        <Route path={`${url}/calendar`} component={NotActive} />
        <Route path={`${url}/edit/new`} component={NotActive} />
        <Route path={`${url}/theater`} component={NotActive} />
        <Route path={`${url}/edit/newsurgery`} component={NotActive} />
        <Route path={`${url}/editAppointment/:id`} component={NotActive} />
        {/* <Route exact path={url} component={WeekAppointment} />
        <Route path={`${url}/today`} component={TodayAppointment} />
        <Route path={`${url}/search`} component={SearchAppointment} />
        <Route path={`${url}/calendar`} component={AppointmentsCalendar} />
        <Route path={`${url}/edit/new`} component={AddAppointment} />
        <Route path={`${url}/theater`} component={TheaterSchedule} />
        <Route path={`${url}/edit/newsurgery`} component={ScheduleSurgery} />
        <Route path={`${url}/editAppointment/:id`} component={EditAppointment} /> */}
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
