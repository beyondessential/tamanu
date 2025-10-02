import React from 'react';
import { Routes, Route, useLocation, useParams, useMatch } from 'react-router-dom';
import styled from 'styled-components';
import { PatientInfoPane } from '../components/PatientInfoPane';
import { PatientNavigation } from '../components/PatientNavigation';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import {
  DischargeSummaryView,
  EncounterView,
  ImagingRequestView,
  LabRequestView,
  PatientView,
} from '../views';
import { Breadcrumb } from '../components/PatientBreadcrumbs';
import { getEncounterType } from '../views/patients/panes/EncounterInfoPane';
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

const EncounterBreadCrumb = () => {
  const { encounter } = useEncounter();
  const { navigateToEncounter } = usePatientNavigation();
  return (
    <Breadcrumb
      onClick={() => navigateToEncounter(encounter.id)}
      title={getEncounterType(encounter || {})}
    />
  );
};

export const usePatientRoutes = () => {
  const { navigateToEncounter, navigateToProgramRegistry } = usePatientNavigation();
  const { encounter } = useEncounter();
  // prefetch userPreferences
  useUserPreferencesQuery();
  const { ability } = useAuth();
  const canAccessMar = ability.can('read', 'MedicationAdministration');

  return [
    {
      index: true,
      component: PatientView,
    },
    {
      path: 'programs/new',
      component: ProgramsView,
      breadcrumbs: [<Breadcrumb key="new-form" title="New Form" />],
    },
    { path: 'referrals/new', component: ReferralsView, breadcrumbs: 'New Referral' },
    {
      path: 'encounter/:encounterId/:modal?',
      component: EncounterView,
      breadcrumbs: [<EncounterBreadCrumb key="encounter" />],
    },
    {
      path: 'encounter/:encounterId/summary/view',
      component: DischargeSummaryView,
      breadcrumbs: [
        <EncounterBreadCrumb key="encounter" />,
        <Breadcrumb
          key="discharge-summary"
          title={
            <TranslatedText
              stringId="encounter.dischargeSummary.title"
              fallback="Discharge Summary"
            />
          }
        />,
      ],
    },
    ...(canAccessMar
      ? [
          {
            path: 'encounter/:encounterId/mar/view',
            component: MarView,
            title: (
              <TranslatedText stringId="encounter.mar.title" fallback="Medication admin record" />
            ),
          },
          {
            path: 'encounter/:encounterId?tab=' + ENCOUNTER_TAB_NAMES.MEDICATION,
            title: <TranslatedText stringId="encounter.medication.title" fallback="Medication" />,
            navigateTo: () =>
              navigateToEncounter(encounter?.id, {
                tab: ENCOUNTER_TAB_NAMES.MEDICATION,
              }),
          },
        ]
      : []),
    {
      path: 'encounter/:encounterId/programs/new',
      component: ProgramsView,
      breadcrumbs: [
        <EncounterBreadCrumb key="encounter" />,
        <Breadcrumb key="new-form" title="New Form" />,
      ],
    },
    {
      path: 'encounter/:encounterId/lab-request/:labRequestId/:modal?',
      component: LabRequestView,
      breadcrumbs: [
        <EncounterBreadCrumb key="encounter" />,
        <Breadcrumb key="lab-request" title="Lab Request" />,
      ],
    },
    {
      path: 'encounter/:encounterId/imaging-request/:imagingRequestId/:modal?',
      component: ImagingRequestView,
      breadcrumbs: [
        <EncounterBreadCrumb key="encounter" />,
        <Breadcrumb key="imaging-request" title="Imaging Request" />,
      ],
    },
    {
      path: 'program-registry/:programRegistryId',
      component: PatientProgramRegistryView,
      navigateTo: () => navigateToProgramRegistry(),
      breadcrumbs: [<ProgramRegistryTitle key="program-registry" />],
    },
    {
      path: 'program-registry/:programRegistryId/survey/:surveyId',
      component: ProgramRegistrySurveyView,
      breadcrumbs: [
        <ProgramRegistryTitle key="program-registry" />,
        <Breadcrumb key="survey" title="Survey" />,
      ],
    },
  ];
};

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

export const PatientRoutes = () => {
  const patientRoutes = usePatientRoutes();
  const location = useLocation();
  const backgroundColor = location.pathname?.endsWith('/mar/view') ? Colors.white : 'initial';
  const isProgramRegistry = !!useMatch('program-registry/:programRegistryId/*');

  return (
    <>
      <NoteModal />
      <TwoColumnDisplay>
        <PatientInfoPane />
        {/* Using contain:size along with overflow: auto here allows sticky navigation section
    to have correct scrollable behavior in relation to the patient info pane and switch components */}
        <PatientPane $backgroundColor={backgroundColor}>
          <PatientPaneInner>
            {/* The breadcrumbs for program registry need to be rendered inside the program registry view so
         that they have access to the programRegistryId url param */}
            {isProgramRegistry ? null : <PatientNavigation patientRoutes={patientRoutes} />}
            <Routes>
              {patientRoutes.map(route => {
                const Element = route.component && React.createElement(route.component);
                if (route.index) {
                  return <Route key="route-index" index element={Element} />;
                }
                return <Route key={`route-${route.path}`} path={route.path} element={Element} />;
              })}
            </Routes>
          </PatientPaneInner>
        </PatientPane>
      </TwoColumnDisplay>
    </>
  );
};
