import { useSelector } from 'react-redux';
import { getPatientNameAsString } from '../components/PatientNameDisplay';
import { PATIENT_PATHS } from '../constants/patientRouteMap';

import { useEncounter } from '../contexts/Encounter';
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
import { usePatientNavigation } from './usePatientNavigation';

export const usePatientRouteMap = () => {
  const { navigateToEncounter, navigateToPatient } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();
  return [
    {
      path: `${PATIENT_PATHS.PATIENT}/:modal?`,
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
  ];
};
