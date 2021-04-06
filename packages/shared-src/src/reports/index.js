import * as admissions from './admissions';
import * as incompleteReferrals from './incomplete-referrals';
import * as recentDiagnoses from './recent-diagnoses';
import * as covidVaccineList from './covid-vaccine-list';
import {
  generateCovidVaccineSummaryDose1Report,
  generateCovidVaccineSummaryDose2Report,
  permission as covidVaccineSummaryPermission,
} from './covid-vaccine-summary';
import * as aefi from './aefi';
import * as fijiRecentDiagnosesSummary from './fiji-recent-diagnoses-summary';

export function getReportModule(reportType) {
  switch (reportType) {
    case 'admissions':
      return admissions;
    case 'incomplete-referrals':
      return incompleteReferrals;
    case 'recent-diagnoses':
      return recentDiagnoses;
    case 'covid-vaccine-list':
      return covidVaccineList;
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
    case 'fiji-recent-diagnoses-summary':
      return fijiRecentDiagnosesSummary;
    default:
      return null;
  }
}
