import React from 'react';
import { Switch, Route, Redirect } from 'react-router';
import { useSelector } from 'react-redux';

import { SERVER_TYPES } from '@tamanu/constants';

import { App } from './App';
import {
  ImagingRoutes,
  MedicationRoutes,
  LabsRoutes,
  BillingRoutes,
  AdministrationRoutes,
  ProgramRegistryRoutes,
  ImmunisationRoutes,
  AppointmentRoutes,
  PatientsRoutes,
  FacilityAdminRoutes,
} from './routes';
import { Sidebar, FACILITY_MENU_ITEMS, SYNC_MENU_ITEMS } from './components/Sidebar';
import { UserActivityMonitor } from './components/UserActivityMonitor';

export const RoutingApp = () => {
  const isSyncServer = useSelector(state => state.auth?.server?.type === SERVER_TYPES.SYNC);
  return isSyncServer ? <RoutingAdminApp /> : <RoutingFacilityApp />;
};

export const RoutingFacilityApp = React.memo(() => (
  <App sidebar={<Sidebar items={FACILITY_MENU_ITEMS} />}>
    <UserActivityMonitor />
    <Switch>
      <Redirect exact path="/" to="/patients/all" />
      <Route path="/patients" component={PatientsRoutes} />
      <Route path="/appointments" component={AppointmentRoutes} />
      <Route path="/imaging-requests" component={ImagingRoutes} />
      <Route path="/lab-requests" component={LabsRoutes} />
      <Route path="/medication-requests" component={MedicationRoutes} />
      <Route path="/invoices" component={BillingRoutes} />
      <Route path="/program-registry" component={ProgramRegistryRoutes} />
      <Route path="/immunisations" component={ImmunisationRoutes} />
      <Route path="/facility-admin" component={FacilityAdminRoutes} />
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
