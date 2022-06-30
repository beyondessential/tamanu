import React from 'react';
import { useSelector } from 'react-redux';
import { Switch, useParams } from 'react-router-dom';
import { PatientInfoPane } from '../components/PatientInfoPane';
import { getPatientNameAsString } from '../components/PatientNameDisplay';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';

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

const PATIENTS_MATCH = '/patients/:category(all|emergency|inpatient|outpatient)';
const PATIENT_MATCH = `${PATIENTS_MATCH}/:patientId`;
const ENCOUNTER_MATCH = `${PATIENT_MATCH}/encounter/:encounterId`;
const LAB_REQUEST_MATCH = `${ENCOUNTER_MATCH}/lab-request/:labRequestId`;
const IMAGING_REQUEST_MATCH = `${ENCOUNTER_MATCH}/imaging-request/:imagingRequestId`;

const CATEGORY_TO_TEXT = {
  all: 'All Patients',
  emergency: 'Emergency Patients',
  outpatient: 'Outpatients',
  inpatient: 'Inpatients',
};

const getCategoryTitle = ({ category }) => CATEGORY_TO_TEXT[category] || '';

export const usePatientRouteMap = () => {
  const { navigateToCategory, navigateToEncounter, navigateToPatient } = usePatientNavigation();
  const params = useParams();
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();
  return [
    {
      path: PATIENTS_MATCH,
      title: getCategoryTitle(params),
      component: props =>
        ({
          all: <PatientListingView />,
          emergency: <TriageListingView />,
          inpatient: <AdmittedPatientsView />,
          outpatient: <OutpatientsView />,
        }[props.match.params.category]),
      navigateTo: navigateToCategory,
      routes: [
        {
          path: `${PATIENT_MATCH}/:modal?`,
          wrapper: ({ children }) => (
            <TwoColumnDisplay>
              <PatientInfoPane />
              <Switch>{children}</Switch>
            </TwoColumnDisplay>
          ),
          component: PatientView,
          title: getPatientNameAsString(patient || {}),
          navigateTo: navigateToPatient,
          routes: [
            {
              path: `${PATIENT_MATCH}/programs/new`,
              component: ProgramsView,
              title: 'New Survey',
            },
            {
              path: `${PATIENT_MATCH}/referrals/new`,
              component: ReferralsView,
              title: 'New Referral',
            },
            {
              path: `${ENCOUNTER_MATCH}/:modal?`,
              component: EncounterView,
              title: getEncounterType(encounter || {}),
              navigateTo: navigateToEncounter,
              routes: [
                {
                  path: `${ENCOUNTER_MATCH}/summary`,
                  component: DischargeSummaryView,
                  title: 'Discharge Summary',
                },
                {
                  path: `${LAB_REQUEST_MATCH}/:modal?`,
                  component: LabRequestView,
                  title: 'Lab Request',
                },
                {
                  path: `${IMAGING_REQUEST_MATCH}/:modal?`,
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
