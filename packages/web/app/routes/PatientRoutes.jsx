import React from 'react';
import { Routes, Route, useLocation } from 'react-router';
import styled from 'styled-components';
import { PatientInfoPane } from '../components/PatientInfoPane';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
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
import { MarView } from '../views/patients/medication/MarView';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { NoteModal } from '../components/NoteModal/NoteModal';
import {
  PatientNavigation,
  Breadcrumb,
  EncounterBreadcrumb,
  MedicationBreadcrumb,
  ProgramRegistryBreadcrumb,
} from '../features/Breadcrumbs';

export const usePatientRoutes = () => {
  // prefetch userPreferences
  useUserPreferencesQuery();
  const { ability } = useAuth();
  const canAccessMar = ability.can('list', 'MedicationAdministration');

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
      breadcrumbs: [<EncounterBreadcrumb key="encounter" />],
    },
    {
      path: 'encounter/:encounterId/summary/view',
      component: DischargeSummaryView,
      breadcrumbs: [
        <EncounterBreadcrumb key="encounter" />,
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
            breadcrumbs: [
              <EncounterBreadcrumb key="encounter" />,
              <MedicationBreadcrumb key="medication" />,
              <Breadcrumb
                key="marview"
                title={
                  <TranslatedText
                    stringId="encounter.mar.title"
                    fallback="Medication admin record"
                  />
                }
              />,
            ],
          },
        ]
      : []),
    {
      path: 'encounter/:encounterId/programs/new',
      component: ProgramsView,
      breadcrumbs: [
        <EncounterBreadcrumb key="encounter" />,
        <Breadcrumb key="new-form" title="New Form" />,
      ],
    },
    {
      path: 'encounter/:encounterId/lab-request/:labRequestId/:modal?',
      component: LabRequestView,
      breadcrumbs: [
        <EncounterBreadcrumb key="encounter" />,
        <Breadcrumb key="lab-request" title="Lab Request" />,
      ],
    },
    {
      path: 'encounter/:encounterId/imaging-request/:imagingRequestId/:modal?',
      component: ImagingRequestView,
      breadcrumbs: [
        <EncounterBreadcrumb key="encounter" />,
        <Breadcrumb key="imaging-request" title="Imaging Request" />,
      ],
    },
    {
      path: 'program-registry/:programRegistryId',
      component: PatientProgramRegistryView,
      breadcrumbs: [<ProgramRegistryBreadcrumb key="program-registry" />],
    },
    {
      path: 'program-registry/:programRegistryId/survey/:surveyId',
      component: ProgramRegistrySurveyView,
      breadcrumbs: [
        <ProgramRegistryBreadcrumb key="program-registry" />,
        <Breadcrumb key="new-form" title="New Form" />,
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

  return (
    <>
      <NoteModal />
      <TwoColumnDisplay>
        <PatientInfoPane />
        {/* Using contain:size along with overflow: auto here allows sticky navigation section
    to have correct scrollable behavior in relation to the patient info pane and switch components */}
        <PatientPane $backgroundColor={backgroundColor}>
          <PatientPaneInner>
            <PatientNavigation patientRoutes={patientRoutes} />
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
