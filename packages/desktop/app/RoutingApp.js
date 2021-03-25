import React from 'react';
import { Switch, Route, Redirect } from 'react-router';
import { App } from './App';
import {
  PatientsRoutes,
  SchedulingRoutes,
  ImagingRoutes,
  MedicationRoutes,
  LabsRoutes,
  BillingRoutes,
  AdministrationRoutes,
  ProgramsRoutes,
  ReferralsRoutes,
  ReportsRoutes,
  ImmunisationRoutes,
} from './routes';

export const RoutingApp = React.memo(() => (
  <App>
    <Switch>
      <Redirect exact path="/" to="/patients" />
      <Route path="/patients" component={PatientsRoutes} />
      <Route path="/appointments" component={SchedulingRoutes} />
      <Route path="/imaging" component={ImagingRoutes} />
      <Route path="/medication" component={MedicationRoutes} />
      <Route path="/labs" component={LabsRoutes} />
      <Route path="/invoices" component={BillingRoutes} />
      <Route path="/admin" component={AdministrationRoutes} />
      <Route path="/programs" component={ProgramsRoutes} />
      <Route path="/referrals" component={ReferralsRoutes} />
      <Route path="/reports" component={ReportsRoutes} />
      <Route path="/immunisations" component={ImmunisationRoutes} />
      {/*
       * TODO fix this hack. For some reason, having an empty object within this switch fixes a bug
       * where none of the app contents would render in a production build.
       */}
    </Switch>
  </App>
));
