import React from 'react';
import { Route, Switch } from 'react-router-dom';

import {
  PatientListingView,
  TriageListingView,
  AdmittedPatientsView,
  PatientView,
  VisitView,
  NotActiveView,
  LabRequestView,
  ImagingRequestView,
  DischargeSummaryView,
  OutpatientsView,
} from '../views';

export const PatientsRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route exact path={match.path} component={PatientListingView} />

      <Route path={`${match.path}/triage`} component={TriageListingView} />

      <Route path={`${match.path}/admitted`} component={AdmittedPatientsView} />
      <Route path={`${match.path}/outpatient`} component={OutpatientsView} />

      <Route path={`${match.path}/new`} component={NotActiveView} />

      <Route path={`${match.path}/view`} component={PatientView} />
      <Route path={`${match.path}/visit/labRequest`} component={LabRequestView} />
      <Route path={`${match.path}/visit/imagingRequest`} component={ImagingRequestView} />
      <Route path={`${match.path}/visit/summary`} component={DischargeSummaryView} />
      <Route path={`${match.path}/visit`} component={VisitView} />
      <NotActiveView />
    </Switch>
  </div>
));
