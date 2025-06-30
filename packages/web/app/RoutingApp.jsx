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
  PatientsRoutes,
  ProgramRegistryRoutes,
} from './routes';
import { Sidebar, useCentralSidebar, useFacilitySidebar } from './components/Sidebar';
import { UserActivityMonitor } from './components/UserActivityMonitor';
import { getServerType } from './store';
import { DashboardView } from './views/dashboard/DashboardView';
import { useSettings } from './contexts/Settings';

export const RoutingApp = () => {
  const isCentralServer = useSelector(getServerType) === SERVER_TYPES.CENTRAL;

  return isCentralServer ? <RoutingAdminApp /> : <RoutingFacilityApp />;
};

export const RoutingFacilityApp = React.memo(() => {
  const sidebarMenuItems = useFacilitySidebar();
  const { isSettingsLoaded } = useSettings();

  return (
    <>
      <App sidebar={<Sidebar items={sidebarMenuItems} />}>
        <UserActivityMonitor />
        <Switch>
          {isSettingsLoaded ? <Redirect exact path="/" to={sidebarMenuItems[0].path} /> : null}
          <Route path="/dashboard" component={DashboardView} />
          <Route path="/patients" component={PatientsRoutes} />
          <Route path="/appointments" component={AppointmentRoutes} />
          <Route path="/imaging-requests" component={ImagingRoutes} />
          <Route path="/lab-requests" component={LabsRoutes} />
          <Route path="/invoices" component={BillingRoutes} />
          <Route path="/program-registry" component={ProgramRegistryRoutes} />
          <Route path="/immunisations" component={ImmunisationRoutes} />
          <Route path="/facility-admin" component={FacilityAdminRoutes} />
        </Switch>
      </App>
    </>
  );
});

export const RoutingAdminApp = React.memo(() => {
  const sidebarMenuItems = useCentralSidebar();
  return (
    <App sidebar={<Sidebar items={sidebarMenuItems} />}>
      <Switch>
        <Redirect exact path="/" to="/admin" />
        <Route path="/admin" component={AdministrationRoutes} />
      </Switch>
    </App>
  );
});
