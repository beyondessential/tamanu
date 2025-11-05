import React from 'react';
import { useSelector } from 'react-redux';
import { Route, Switch, useLocation, useParams, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
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
import { ProgramsView } from '../views/programs/ProgramsView';
import { ReferralsView } from '../views/referrals/ReferralsView';
import { PatientProgramRegistryView } from '../views/programRegistry/PatientProgramRegistryView';
import { ProgramRegistrySurveyView } from '../views/programRegistry/ProgramRegistrySurveyView';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useUserPreferencesQuery } from '../api/queries/useUserPreferencesQuery';
import { useProgramRegistryQuery } from '../api/queries/useProgramRegistryQuery';
import { TranslatedReferenceData } from '../components';
import { MarView } from '../views/patients/medication/MarView';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { NoteModal } from '../components/NoteModal/NoteModal';
import { ENCOUNTER_TAB_NAMES } from '../constants/encounterTabNames';
import { TranslatedEnumField } from '@tamanu/ui-components';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';

// This component gets the programRegistryId and uses it to render the title of the program registry
// in the breadcrumbs. It is the only place where breadcrumbs use url params to render the title.
const ProgramRegistryTitle = () => {
  const params = useParams();
  const { programRegistryId } = params;
  const { data: programRegistry } = useProgramRegistryQuery(programRegistryId);

  if (!programRegistry) {
    return null;
  }

  return (
    <TranslatedReferenceData
      fallback={programRegistry.name}
      value={programRegistry.id}
      category="programRegistry"
    />
  );
};

export const usePatientRoutes = () => {
  const {
    navigateToEncounter,
    navigateToPatient,
    navigateToProgramRegistry,
  } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();
  // prefetch userPreferences
  useUserPreferencesQuery();
  const { ability } = useAuth();
  const canAccessMar = ability.can('list', 'MedicationAdministration');

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
          title: 'New Form',
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
          title: (
            <TranslatedEnumField
              enumValues={ENCOUNTER_TYPE_LABELS}
              value={encounter.encounterType}
            />
          ),
          routes: [
            {
              path: `${PATIENT_PATHS.SUMMARY}/view`,
              component: DischargeSummaryView,
              title: (
                <TranslatedText
                  stringId="encounter.dischargeSummary.title"
                  fallback="Discharge Summary"
                />
              ),
            },
            ...(canAccessMar
              ? [
                  {
                    path: `${PATIENT_PATHS.MAR}/view`,
                    component: MarView,
                    title: (
                      <TranslatedText
                        stringId="encounter.mar.title"
                        fallback="Medication admin record"
                      />
                    ),
                    subPaths: [
                      {
                        path: `${PATIENT_PATHS.ENCOUNTER}?tab=${ENCOUNTER_TAB_NAMES.MEDICATION}`,
                        title: (
                          <TranslatedText
                            stringId="encounter.medication.title"
                            fallback="Medication"
                          />
                        ),
                        navigateTo: () =>
                          navigateToEncounter(encounter.id, {
                            tab: ENCOUNTER_TAB_NAMES.MEDICATION,
                          }),
                      },
                    ],
                  },
                ]
              : []),
            {
              path: `${PATIENT_PATHS.ENCOUNTER}/programs/new`,
              component: ProgramsView,
              title: 'New Form',
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
          navigateTo: () => navigateToProgramRegistry(),
          title: <ProgramRegistryTitle />,
          routes: [
            {
              path: PATIENT_PATHS.PROGRAM_REGISTRY_SURVEY,
              component: ProgramRegistrySurveyView,
              title: 'Survey',
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
  background-color: ${p => p.$backgroundColor};
`;

const PATIENT_PANE_WIDTH = '650px';
const PatientPaneInner = styled.div`
  // We don't support mobile devices.
  // Set a minimum width to stop layouts breaking on small screens
  min-width: ${PATIENT_PANE_WIDTH};
`;

const PatientRoutesContent = () => {
  const patientRoutes = usePatientRoutes();
  const location = useLocation();
  const backgroundColor = location.pathname?.endsWith('/mar/view') ? Colors.white : 'initial';
  const isProgramRegistry = !!useRouteMatch(PATIENT_PATHS.PROGRAM_REGISTRY);

  return (
    <>
      <TwoColumnDisplay>
        <PatientInfoPane />
        {/* Using contain:size along with overflow: auto here allows sticky navigation section
    to have correct scrollable behavior in relation to the patient info pane and switch components */}
        <PatientPane $backgroundColor={backgroundColor}>
          <PatientPaneInner>
            {/* The breadcrumbs for program registry need to be rendered inside the program registry view so
         that they have access to the programRegistryId url param */}
            {isProgramRegistry ? null : <PatientNavigation patientRoutes={patientRoutes} />}
            <Switch>
              {patientRoutes.map(route => (
                <RouteWithSubRoutes key={`route-${route.path}`} {...route} />
              ))}
            </Switch>
          </PatientPaneInner>
        </PatientPane>
      </TwoColumnDisplay>
    </>
  );
};

export const PatientRoutes = React.memo(() => {
  return (
    <>
      <NoteModal />
      <PatientRoutesContent />
    </>
  );
}, isPathUnchanged);
