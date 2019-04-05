import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import WeeksAppointments from './WeeksAppointments';
import TodaysAppointments from './TodaysAppointments';
import SearchAppointment from './SearchAppointment';
import AppointmentsCalendar from './AppointmentsCalendar';
import Appointment from './Appointment';
import TheaterSchedule from './TheaterSchedule';
import SurgeryAppointment from './SurgeryAppointment';

export default function Routes({ url }) {
  return (
    <Switch>
      <Route exact path={url} component={WeeksAppointments} />
      <Route path={`${url}/week`} component={WeeksAppointments} />
      <Route path={`${url}/today`} component={TodaysAppointments} />
      <Route path={`${url}/search`} component={SearchAppointment} />
      <Route path={`${url}/calendar`} component={AppointmentsCalendar} />
      <Route path={`${url}/appointmentByPatient/:patientId`} component={Appointment} />
      <Route path={`${url}/appointment/new`} component={Appointment} />
      <Route path={`${url}/appointment/:id`} component={Appointment} />
      <Route path={`${url}/theater`} component={TheaterSchedule} />
      <Route path={`${url}/surgery/new`} component={SurgeryAppointment} />
      <Route path={`${url}/surgery/:id`} component={SurgeryAppointment} />
    </Switch>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
