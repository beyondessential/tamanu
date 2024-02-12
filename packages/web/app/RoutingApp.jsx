import React from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { useSelector } from 'react-redux';

import { SERVER_TYPES } from '@tamanu/constants';

import { App } from './App';
import {
  AdministrationRoutes,
  AppointmentRoutes,
  BillingRoutes,
  FacilityAdminRoutes,
  ImagingRoutes,
  ImmunisationRoutes,
  LabsRoutes,
  MedicationRoutes,
  PatientsRoutes,
  ProgramRegistryRoutes,
} from './routes';
import { Sidebar, SYNC_MENU_ITEMS, useFacilitySidebar } from './components/Sidebar';
import { UserActivityMonitor } from './components/UserActivityMonitor';

export const RoutingApp = () => {
  const isSyncServer = useSelector(state => state.auth?.server?.type === SERVER_TYPES.CENTRAL);
  return isSyncServer ? <RoutingAdminApp /> : <RoutingFacilityApp />;
};

const getHomePageUrl = items => {
  // Get the first child item of the first parent item
  const firstItem = items.find(item => item.children.length > 0);
  return firstItem.children[0].path;
};

export const RoutingFacilityApp = React.memo(() => {
  const sidebarMenuItems = useFacilitySidebar();
  const homePageUrl = getHomePageUrl(sidebarMenuItems);
  return (
    <App sidebar={<Sidebar items={sidebarMenuItems} />}>
      <UserActivityMonitor />
      <Switch>
        <Redirect exact path="/" to={homePageUrl} />
        <Route path="/patients" component={PatientsRoutes} />
        <Route path="/appointments" component={AppointmentRoutes} />
        <Route path="/imaging-requests" component={ImagingRoutes} />
        <Route path="/lab-requests" component={LabsRoutes} />
        <Route path="/medication-requests" component={MedicationRoutes} />
        <Route path="/invoices" component={BillingRoutes} />
        <Route path="/program-registry" component={ProgramRegistryRoutes} />
        <Route path="/immunisations" component={ImmunisationRoutes} />
        <Route path="/facility-admin" component={FacilityAdminRoutes} />
      </Switch>
    </App>
  );
});

export const RoutingAdminApp = React.memo(() => (
  <App sidebar={<Sidebar items={SYNC_MENU_ITEMS} />}>
    <Switch>
      <Redirect exact path="/" to="/admin" />
      <Route path="/admin" component={AdministrationRoutes} />
    </Switch>
  </App>
));
