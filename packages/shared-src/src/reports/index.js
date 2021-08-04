import * as admissions from './admissions';
import * as incompleteReferrals from './incomplete-referrals';
import * as recentDiagnoses from './recent-diagnoses';
import * as covidVaccineList from './covid-vaccine-list';
import * as covidVaccineDailySummaryByVillage from './covid-vaccine-daily-summary-village';
import {
  generateCovidVaccineSummaryDose1Report,
  generateCovidVaccineSummaryDose2Report,
  permission as covidVaccineSummaryPermission,
} from './covid-vaccine-summary';
import * as aefi from './aefi';
import * as samoaAefi from './samoa-aefi';
import * as numberPatientsRegisteredByDate from './number-patients-registered-by-date';
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
    case 'covid-vaccine-list':
      return covidVaccineList;
    case 'covid-vaccine-daily-summary-village':
      return covidVaccineDailySummaryByVillage;
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
    case 'covid-swab-lab-test-list':
      return covidSwabLabTestList;
    case 'covid-swab-lab-tests-summary':
      return covidSwabLabTestsSummary;
  }
}
