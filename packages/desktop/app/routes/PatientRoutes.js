import React from 'react';
import { useSelector } from 'react-redux';
import { Switch, Route } from 'react-router-dom';
import styled from 'styled-components';
import { useUrlQueryParams } from '../hooks';
import { PatientInfoPane } from '../components/PatientInfoPane';
import { getPatientNameAsString } from '../components/PatientNameDisplay';
import { PatientNavigation } from '../components/PatientNavigation';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import { PATIENT_PATHS } from '../constants/patientPaths';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import {
  DischargeSummaryView,
  EncounterView,
  ImagingRequestView,
  LabRequestView,
  PatientView,
} from '../views';
import { getEncounterType } from '../views/patients/panes/EncounterInfoPane';
import { ProgramsView } from '../views/programs/ProgramsView';
import { ReferralsView } from '../views/referrals/ReferralsView';
import { PatientProgramRegistryView } from '../views/programRegistry/PatientProgramRegistryView';
import { ProgramRegistrySurveyView } from '../views/programRegistry/ProgramRegistrySurveyView';

export const usePatientRoutes = () => {
  const {
    navigateToEncounter,
    navigateToPatient,
    navigateToProgramRegistry,
  } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();
  const queryParams = useUrlQueryParams();
  return [
    {
      path: PATIENT_PATHS.PATIENT,
      component: PatientView,
      navigateTo: () => navigateToPatient(patient.id),
      title: getPatientNameAsString(patient || {}),
      routes: [
        {
          path: `${PATIENT_PATHS.PATIENT}/programs/new`,
          component: ProgramsView,
          title: 'New Survey',
        },
        {
          path: `${PATIENT_PATHS.PATIENT}/referrals/new`,
          component: ReferralsView,
          title: 'New Referral',
        },
        {
          path: `${PATIENT_PATHS.ENCOUNTER}/:modal?`,
          component: EncounterView,
          navigateTo: () => navigateToEncounter(encounter.id),
          title: getEncounterType(encounter || {}),
          routes: [
            {
              path: `${PATIENT_PATHS.SUMMARY}/view`,
              component: DischargeSummaryView,
              title: 'Discharge Summary',
            },
            {
              path: `${PATIENT_PATHS.ENCOUNTER}/programs/new`,
              component: ProgramsView,
              title: 'New Survey',
            },
            {
              path: `${PATIENT_PATHS.LAB_REQUEST}/:modal?`,
              component: LabRequestView,
              title: 'Lab Request',
            },
            {
              path: `${PATIENT_PATHS.IMAGING_REQUEST}/:modal?`,
              component: ImagingRequestView,
              title: 'Imaging Request',
            },
          ],
        },
        {
          path: PATIENT_PATHS.PROGRAM_REGISTRY,
          component: PatientProgramRegistryView,
          navigateTo: programRegistry => navigateToProgramRegistry(programRegistry.id),
          title: queryParams.get('title'),
          routes: [
            {
              path: PATIENT_PATHS.PROGRAM_REGISTRY_SURVEY,
              component: ProgramRegistrySurveyView,
              // title: 'Discharge Summary',
            },
          ],
        },
      ],
    },
  ];
};

const isPathUnchanged = (prevProps, nextProps) => prevProps.match.path === nextProps.match.path;

const RouteWithSubRoutes = ({ path, component, routes }) => (
  <>
    <Route exact path={path} component={component} />
    {routes?.map(subRoute => (
      <RouteWithSubRoutes key={`route-${subRoute.path}`} {...subRoute} />
    ))}
  </>
);

const PatientPane = styled.div`
  overflow: auto;
`;

const PATIENT_PANE_WIDTH = '650px';
const PatientPaneInner = styled.div`
  // We don't support mobile devices.
  // Set a minimum width to stop layouts breaking on small screens
  min-width: ${PATIENT_PANE_WIDTH};
`;

export const PatientRoutes = React.memo(() => {
  const patientRoutes = usePatientRoutes();
  return (
    <TwoColumnDisplay>
      <PatientInfoPane />
      {/* Using contain:size along with overflow: auto here allows sticky navigation section
      to have correct scrollable behavior in relation to the patient info pane and switch components */}
      <PatientPane>
        <PatientPaneInner>
          <PatientNavigation patientRoutes={patientRoutes} />
          <Switch>
            {patientRoutes.map(route => (
              <RouteWithSubRoutes key={`route-${route.path}`} {...route} />
            ))}
          </Switch>
        </PatientPaneInner>
      </PatientPane>
    </TwoColumnDisplay>
  );
}, isPathUnchanged);
