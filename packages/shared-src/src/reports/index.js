import { generateAdmissionsReport } from './admissions';
import { generateIncompleteReferralsReport } from './incomplete-referrals';
import { generateRecentDiagnosesReport } from './recent-diagnoses';
import { generateCovidVaccineListReport } from './covid-vaccine-list';
import {
  generateCovidVaccineSummaryDose1Report,
  generateCovidVaccineSummaryDose2Report,
} from './covid-vaccine-summary';
import { generateAefiReport } from './aefi';

export const ReportTypeMapper = {
  admissions: {
    permission: 'Encounter',
    dataGenerator: generateAdmissionsReport,
  },
  'incomplete-referrals': {
    permission: 'Referral',
    dataGenerator: generateIncompleteReferralsReport,
  },
  'recent-diagnoses': {
    permission: 'EncounterDiagnosis',
    dataGenerator: generateRecentDiagnosesReport,
  },
  'covid-vaccine-list': {
    permission: 'PatientVaccine',
    dataGenerator: generateCovidVaccineListReport,
  },
  'covid-vaccine-summary-dose1': {
    permission: 'PatientVaccine',
    dataGenerator: generateCovidVaccineSummaryDose1Report,
  },
  'covid-vaccine-summary-dose2': {
    permission: 'PatientVaccine',
    dataGenerator: generateCovidVaccineSummaryDose2Report,
  },
  aefi: {
    permission: 'Survey',
    dataGenerator: generateAefiReport,
  },
};
