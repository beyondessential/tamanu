import React from 'react';
import { Routes, Route, Navigate, useMatch } from 'react-router';
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
import { Sidebar, useCentralSidebar, useFacilitySidebar } from './components/Sidebar';
import { UserActivityMonitor } from './components/UserActivityMonitor';
import { getServerType } from './store';
import { DashboardView } from './views/dashboard/DashboardView';
import { useSettings } from './contexts/Settings';
import { KioskView } from './views/kiosk/KioskView';
import { TelemetryRouteListener } from './telemetry';

export const RoutingApp = () => {
  const isCentralServer = useSelector(getServerType) === SERVER_TYPES.CENTRAL;
  return (
    <>
      {/* spec: BTEL — times each in-app navigation */}
      <TelemetryRouteListener />
      {isCentralServer ? <RoutingAdminApp /> : <RoutingFacilityApp />}
    </>
  );
};

export const RoutingFacilityApp = React.memo(() => {
  const isKiosk = Boolean(useMatch('/kiosk/*'));
  return isKiosk ? <RoutingKioskApp /> : <RoutingClinicalApp />;
});

/**
 * The patient self check-in kiosk runs on its own, without the sidebar or the idle logout:
 * a staff account signs the tablet in, then patients use it all day.
 */
const RoutingKioskApp = () => (
  <App sidebar={null}>
    <KioskView />
  </App>
);

const RoutingClinicalApp = () => {
  const sidebarMenuItems = useFacilitySidebar();
  const { isSettingsLoaded } = useSettings();

  return (
    <App sidebar={<Sidebar items={sidebarMenuItems} />}>
      <UserActivityMonitor />
      <Routes>
        {isSettingsLoaded ? (
          <Route path="/" element={<Navigate to={sidebarMenuItems[0].path} replace />} />
        ) : null}
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/patients/*" element={<PatientsRoutes />} />
        <Route path="/appointments/*" element={<AppointmentRoutes />} />
        <Route path="/imaging-requests/*" element={<ImagingRoutes />} />
        <Route path="/medication/*" element={<MedicationRoutes />} />
        <Route path="/lab-requests/*" element={<LabsRoutes />} />
        <Route path="/invoices/*" element={<BillingRoutes />} />
        <Route path="/program-registry/*" element={<ProgramRegistryRoutes />} />
        <Route path="/immunisations/*" element={<ImmunisationRoutes />} />
        <Route path="/facility-admin/*" element={<FacilityAdminRoutes />} />
      </Routes>
    </App>
  );
};

export const RoutingAdminApp = React.memo(() => {
  const sidebarMenuItems = useCentralSidebar();
  return (
    <App sidebar={<Sidebar items={sidebarMenuItems} />}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/*" element={<AdministrationRoutes />} />
      </Routes>
    </App>
  );
});
