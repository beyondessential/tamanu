import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
} from 'react-router';
import {
  AllergiesView,
  ConditionsView,
  DashboardView,
  EditPatientDetailsView,
  LoginView,
  MedicationsView,
  PatientDetailsView,
  ProceduresView,
  RegistrationView,
  RequestLoginTokenView,
  SurveyView,
  VaccinationsView,
} from './views';
import { PublicRoute } from '@routes/PublicRoute';
import { PrivateRoute } from '@routes/PrivateRoute';

// A data router, so a page with unsaved changes can hold navigation until the patient decides
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<PrivateRoute element={<DashboardView />} />} />
      <Route path="/survey/:surveyId" element={<PrivateRoute element={<SurveyView />} />} />
      <Route path="/details" element={<PrivateRoute element={<PatientDetailsView />} />} />
      <Route
        path="/details/:group"
        element={<PrivateRoute element={<EditPatientDetailsView />} />}
      />
      <Route path="/conditions" element={<PrivateRoute element={<ConditionsView />} />} />
      <Route path="/allergies" element={<PrivateRoute element={<AllergiesView />} />} />
      <Route path="/medications" element={<PrivateRoute element={<MedicationsView />} />} />
      <Route path="/vaccinations" element={<PrivateRoute element={<VaccinationsView />} />} />
      <Route path="/procedures" element={<PrivateRoute element={<ProceduresView />} />} />
      <Route path="/login" element={<PublicRoute element={<RequestLoginTokenView />} />} />
      <Route path="/login-submit" element={<PublicRoute element={<LoginView />} />} />
      <Route path="/register/:token" element={<PublicRoute element={<RegistrationView />} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </>,
  ),
);

export const App = () => <RouterProvider router={router} />;
