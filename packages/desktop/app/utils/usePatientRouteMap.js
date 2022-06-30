import React from 'react';
import { useSelector } from 'react-redux';
import { Switch, useParams } from 'react-router-dom';
import { PatientInfoPane } from '../components/PatientInfoPane';
import { getPatientNameAsString } from '../components/PatientNameDisplay';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import {
  PATIENT_PATHS,
  PATIENT_CATEGORIES,
  PATIENT_CATEGORY_TO_TITLE,
} from '../constants/patientRouteMap';

import { useEncounter } from '../contexts/Encounter';
import {
  AdmittedPatientsView,
  DischargeSummaryView,
  EncounterView,
  ImagingRequestView,
  LabRequestView,
  OutpatientsView,
  PatientListingView,
  PatientView,
  TriageListingView,
} from '../views';
import { getEncounterType } from '../views/patients/panes/EncounterInfoPane';
import { ProgramsView } from '../views/programs/ProgramsView';
import { ReferralsView } from '../views/referrals/ReferralsView';
import { usePatientNavigation } from './usePatientNavigation';

const getCategoryTitle = ({ category }) => PATIENT_CATEGORY_TO_TITLE[category] || '';

export const usePatientRouteMap = () => {
  const { navigateToCategory, navigateToEncounter, navigateToPatient } = usePatientNavigation();
  const params = useParams();
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();
  return [
    {
      path: PATIENT_PATHS.CATEGORY,
      title: getCategoryTitle(params),
      component: props =>
        ({
          [PATIENT_CATEGORIES.ALL]: <PatientListingView />,
          [PATIENT_CATEGORIES.EMERGENCY]: <TriageListingView />,
          [PATIENT_CATEGORIES.INPATIENT]: <AdmittedPatientsView />,
          [PATIENT_CATEGORIES.OUTPATIENT]: <OutpatientsView />,
        }[props.match.params.category]),
      navigateTo: () => navigateToCategory(params.category),
      routes: [
        {
          path: `${PATIENT_PATHS.PATIENT}/:modal?`,
          wrapper: ({ children }) => (
            <TwoColumnDisplay>
              <PatientInfoPane />
              <Switch>{children}</Switch>
            </TwoColumnDisplay>
          ),
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
                  path: `${PATIENT_PATHS.ENCOUNTER}/summary`,
                  component: DischargeSummaryView,
                  title: 'Discharge Summary',
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
          ],
        },
      ],
    },
  ];
};
