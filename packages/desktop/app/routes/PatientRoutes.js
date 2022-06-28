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
import { ProgramsView } from '../views/programs/ProgramsView';
import { ReferralsView } from '../views/referrals/ReferralsView';

export const PatientRoutes = React.memo(({ match }) => (
  <TwoColumnDisplay>
    <PatientInfoPane />
    <Switch>
      <Route exact path={match.path} component={PatientView} />
      <Route path={`${match.path}/referrals/new`} component={ReferralsView} />
      <Route path={`${match.path}/programs/new`} component={ProgramsView} />
      <Route
        path={`${match.path}/encounter/:encounterId/imaging-request/:imagingRequestId/:modal?`}
        component={ImagingRequestView}
      />
      <Route
        path={`${match.path}/encounter/:encounterId/lab-request/:labRequestId/:modal?`}
        component={LabRequestView}
      />
      <Route
        path={`${match.path}/encounter/:encounterId/summary`}
        component={DischargeSummaryView}
      />
      <Route path={`${match.path}/encounter/:encounterId/:modal?`} component={EncounterView} />
      <Redirect to={match.path} />
    </Switch>
  </TwoColumnDisplay>
));
