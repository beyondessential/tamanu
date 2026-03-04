import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import { LocationBookingsContextProvider } from '../contexts/LocationBookings';
import { LocationBookingsView, OutpatientAppointmentsView } from '../views/scheduling';

export const AppointmentRoutes = React.memo(() => (
  <Routes>
    <Route path="outpatients" element={<OutpatientAppointmentsView />} />
    <Route
      path="locations"
      element={
        <LocationBookingsContextProvider>
          <LocationBookingsView />
        </LocationBookingsContextProvider>
      }
    />
    <Route path="*" element={<Navigate to="outpatients" replace />} />
  </Routes>
));
