import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  PatientListingView,
  TriageListingView,
  AdmittedPatientsView,
  PatientView,
  EncounterView,
  NotActiveView,
  LabRequestView,
  ImagingRequestView,
  DischargeSummaryView,
  OutpatientsView,
} from '../views';

// patients/all/:patientId/encounter/:encounterId/lab-request
// patients/emergency/**/*
// patients/inpatients/**/*
// patients/outpatients/**/*

// .../:patientId/programs

export const PatientsRoutes = React.memo(({ match }) => (
  <Switch>
    <Redirect exact path={match.path} to={`${match.path}/all`} />

    <Route
      path={`${match.path}/:category(all|emergency|inpatient|outpatient)/:patientId/encounter/:encounterId/imaging-request/:imagingRequestId/:modal?`}
      component={ImagingRequestView}
    />
    <Route
      path={`${match.path}/:category(all|emergency|inpatient|outpatient)/:patientId/encounter/:encounterId/summary`}
      component={DischargeSummaryView}
    />
    <Route
      path={`${match.path}/:category(all|emergency|inpatient|outpatient)/:patientId/encounter/:encounterId`}
      component={EncounterView}
    />
    <Route
      path={`${match.path}/:category(all|emergency|inpatient|outpatient)/:patientId`}
      component={PatientView}
    />


    <Route path={`${match.path}/all`} component={PatientListingView} />
    <Route path={`${match.path}/emergency`} component={TriageListingView} />
    <Route path={`${match.path}/inpatient`} component={AdmittedPatientsView} />
    <Route path={`${match.path}/outpatient`} component={OutpatientsView} />



    <Route path={`${match.path}/encounter/labRequest/:modal?`} component={LabRequestView} />
    {/* <Route path={`${match.path}/encounter/imagingRequest/:modal?`} component={ImagingRequestView} /> */}
    <NotActiveView />
  </Switch>
));
