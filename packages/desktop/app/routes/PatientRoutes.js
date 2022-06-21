import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { PatientInfoPane } from '../components/PatientInfoPane';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import {
  EncounterView,
  PatientView,
  ImagingRequestView,
  DischargeSummaryView,
  LabRequestView,
} from '../views';

export const PatientRoutes = React.memo(({ match }) => (
  <TwoColumnDisplay>
    <PatientInfoPane />
    <Switch>
      <Route exact path={match.path} component={PatientView} />
      <Route
        path={`${match.path}/encounter/:encounterId/imaging-request/:imagingRequestId/:modal?`}
        component={ImagingRequestView}
      />
      <Route
        path={`${match.path}/encounter/:encounterId/lab-request/:labRequestId/:modal?`}
        component={LabRequestView}
      />
      <Route path={`${match.path}/encounter/:encounterId/:modal?`} component={EncounterView} />
      <Route
        path={`${match.path}/encounter/:encounterId/summary`}
        component={DischargeSummaryView}
      />
      <Redirect from="*" to={match.path} />
    </Switch>
  </TwoColumnDisplay>
));
