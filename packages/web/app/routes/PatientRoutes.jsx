import React from 'react';
import { Routes, Route, useMatch } from 'react-router';
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
import { PATIENT_PATHS } from '../constants/patientPaths';
import { useAuth } from '../contexts/Auth';
import { PatientSearchParametersProvider } from '../contexts/PatientViewSearchParameters';
import { PatientProvider } from '../contexts/Patient';
import { EncounterProvider, useEncounter } from '../contexts/Encounter';
import { ErrorMessage } from '../components/ErrorMessage';
import { OutlinedButton } from '@tamanu/ui-components';
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
      breadcrumbs: [
        <Breadcrumb
          key="new-form"
          title={<TranslatedText stringId="program.action.newForm" fallback="New form" />}
        />,
      ],
    },
    {
      path: 'programs/:surveyResponseId/edit',
      component: ProgramsView,
      breadcrumbs: [
        <Breadcrumb
          key="edit-form"
          title={<TranslatedText stringId="program.action.editForm" fallback="Edit form" />}
        />,
      ],
    },
    {
      path: 'referrals/new',
      component: ReferralsView,
      breadcrumbs: [
        <Breadcrumb
          key="new-referral"
          title={
            <TranslatedText stringId="patient.referral.action.create" fallback="New referral" />
          }
        />,
      ],
    },
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
              fallback="Discharge summary"
            />
          }
        />,
      ],
    },
    ...(canAccessMar
      ? [
          {
            path: 'encounter/:encounterId/mar/view/:date?',
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
        <Breadcrumb
          key="new-form"
          title={<TranslatedText stringId="program.action.newForm" fallback="New form" />}
        />,
      ],
    },
    {
      path: 'encounter/:encounterId/programs/:surveyResponseId/edit',
      component: ProgramsView,
      breadcrumbs: [
        <EncounterBreadcrumb key="encounter" />,
        <Breadcrumb
          key="edit-form"
          title={<TranslatedText stringId="program.action.editForm" fallback="Edit form" />}
        />,
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
        <Breadcrumb
          key="new-form"
          title={<TranslatedText stringId="program.action.newForm" fallback="New form" />}
        />,
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

const RetryRow = styled.div`
  display: flex;
  justify-content: center;
`;

// The encounter named by the URL failed to load for a reason that may not recur. The patient's
// navigation stays on screen and the clinician gets a retry, rather than an endless spinner or
// being moved somewhere they didn't ask to go.
const EncounterLoadError = () => {
  const { refetch } = useEncounter();
  return (
    <>
      <ErrorMessage
        title={
          <TranslatedText
            stringId="encounter.error.load.title"
            fallback="Unable to load encounter"
          />
        }
        errorMessage={
          <TranslatedText
            stringId="encounter.error.load.message"
            fallback="Something went wrong loading this encounter. Check your connection and try again."
          />
        }
      />
      <RetryRow>
        <OutlinedButton onClick={() => refetch()}>
          <TranslatedText stringId="general.action.retry" fallback="Retry" />
        </OutlinedButton>
      </RetryRow>
    </>
  );
};

const PatientRouteContent = ({ patientRoutes }) => {
  const { error } = useEncounter();
  if (error) return <EncounterLoadError />;

  return (
    <Routes>
      {patientRoutes.map(route => {
        const Element = route.component && React.createElement(route.component);
        if (route.index) {
          return <Route key="route-index" index element={Element} />;
        }
        return <Route key={`route-${route.path}`} path={route.path} element={Element} />;
      })}
    </Routes>
  );
};

export const PatientRoutes = () => {
  const patientRoutes = usePatientRoutes();
  const isMarView = Boolean(useMatch(`${PATIENT_PATHS.MAR}/view/:date?`));
  const backgroundColor = isMarView ? Colors.white : 'initial';

  return (
    <PatientProvider>
      <EncounterProvider>
        <PatientSearchParametersProvider>
          <NoteModal />
          <TwoColumnDisplay>
            <PatientInfoPane />
            {/* Using contain:size along with overflow: auto here allows sticky navigation section
    to have correct scrollable behavior in relation to the patient info pane and switch components */}
            <PatientPane $backgroundColor={backgroundColor}>
              <PatientPaneInner>
                <PatientNavigation patientRoutes={patientRoutes} />
                <PatientRouteContent patientRoutes={patientRoutes} />
              </PatientPaneInner>
            </PatientPane>
          </TwoColumnDisplay>
        </PatientSearchParametersProvider>
      </EncounterProvider>
    </PatientProvider>
  );
};
