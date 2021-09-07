import * as admissions from './admissions';
import * as incompleteReferrals from './incomplete-referrals';
import * as recentDiagnoses from './recent-diagnoses';
import * as vaccineList from './vaccine-list';
import {
  generateCovidVaccineSummaryDose1Report,
  generateCovidVaccineSummaryDose2Report,
  permission as covidVaccineSummaryPermission,
} from './covid-vaccine-summary';
import * as aefi from './aefi';
import * as samoaAefi from './samoa-aefi';
import * as numberPatientsRegisteredByDate from './number-patients-registered-by-date';
import * as registeredPatients from './registered-patients';
import * as covidSwabLabTestList from './covid-swab-lab-test-list';
import * as covidSwabLabTestsSummary from './covid-swab-lab-tests-summary';

export function getReportModule(reportType) {
  switch (reportType) {
    default:
      return null;
    case 'admissions':
      return admissions;
    case 'incomplete-referrals':
      return incompleteReferrals;
    case 'recent-diagnoses':
      return recentDiagnoses;
    case 'vaccine-list':
      return vaccineList;
    case 'covid-vaccine-summary-dose1':
      return {
        permission: covidVaccineSummaryPermission,
        dataGenerator: generateCovidVaccineSummaryDose1Report,
      };
    case 'covid-vaccine-summary-dose2':
      return {
        permission: covidVaccineSummaryPermission,
        dataGenerator: generateCovidVaccineSummaryDose2Report,
      };
    case 'aefi':
      return aefi;
    case 'samoa-aefi':
      return samoaAefi;
    case 'number-patients-registered-by-date':
      return numberPatientsRegisteredByDate;
    case 'registered-patients':
      return registeredPatients;
    case 'covid-swab-lab-test-list':
      return covidSwabLabTestList;
    case 'covid-swab-lab-tests-summary':
      return covidSwabLabTestsSummary;
  }
}
