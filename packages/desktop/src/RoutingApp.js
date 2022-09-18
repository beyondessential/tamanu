import React from 'react';
import { Switch, Route, Redirect } from 'react-router';
import { useSelector } from 'react-redux';

import { SERVER_TYPES } from 'shared/constants';

import { App } from './App';
import {
  ImagingRoutes,
  MedicationRoutes,
  LabsRoutes,
  BillingRoutes,
  AdministrationRoutes,
  ProgramsRoutes,
  ReportsRoutes,
  ImmunisationRoutes,
  AppointmentRoutes,
  PatientsRoutes,
} from './routes';
import { Sidebar, FACILITY_MENU_ITEMS, SYNC_MENU_ITEMS } from './components/Sidebar';
import { TopBar, Notification } from './components';

export const RoutingApp = () => {
  const isSyncServer = useSelector(state => state.auth?.server?.type === SERVER_TYPES.SYNC);
  return isSyncServer ? <RoutingAdminApp /> : <RoutingFacilityApp />;
};

export const RoutingFacilityApp = React.memo(() => (
  <App sidebar={<Sidebar items={FACILITY_MENU_ITEMS} />}>
    <Switch>
      <Redirect exact path="/" to="/patients/all" />
      <Route path="/patients" component={PatientsRoutes} />
      <Route path="/appointments" component={AppointmentRoutes} />
      <Route path="/imaging-requests" component={ImagingRoutes} />
      <Route path="/lab-requests" component={LabsRoutes} />
      <Route path="/medication-requests" component={MedicationRoutes} />
      <Route path="/invoices" component={BillingRoutes} />
      <Route path="/programs" component={ProgramsRoutes} />
      <Route path="/reports" component={ReportsRoutes} />
      <Route path="/immunisations" component={ImmunisationRoutes} />
      {/*
       * TODO fix this hack. For some reason, having an empty object within this switch fixes a bug
       * where none of the app contents would render in a production build.
       */}
    </Switch>
  </App>
));

export const RoutingAdminApp = React.memo(() => (
  <App sidebar={<Sidebar items={SYNC_MENU_ITEMS} />}>
    <Switch>
      <Redirect exact path="/" to="/admin" />
      <Route path="/admin" component={AdministrationRoutes} />
      {/*
       * TODO fix this hack. For some reason, having an empty object within this switch fixes a bug
       * where none of the app contents would render in a production build.
       */}
    </Switch>
  </App>
));

export const AdminPlaceholder = React.memo(() => {
  const user = useSelector(state => state.auth?.user);

  return (
    <>
      <TopBar title="New sync admin panel" />
      <Notification message={`Successfully logged in as ${user.displayName}`} />
    </>
  );
});
