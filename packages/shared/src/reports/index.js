import * as admissions from './admissions';
import * as incompleteReferrals from './incomplete-referrals';
import * as recentDiagnoses from './recent-diagnoses';
import * as vaccineList from './vaccine-list';
import * as tuvaluVaccineList from './tuvalu-vaccine-list';
import * as covidVaccineList from './covid-module/covid-vaccine-list';
import {
  generateCovidVaccineSummaryDose1Report,
  generateCovidVaccineSummaryDose2Report,
} from './covid-module/covid-vaccine-summary';
import * as aefi from './aefi';
import * as samoaAefi from './samoa-aefi';
import * as numberPatientsRegisteredByDate from './number-patients-registered-by-date';
import * as registeredPatients from './registered-patients';
import * as fijiCovidSwabLabTestList from './covid-module/fiji/fiji-covid-swab-lab-test-list';
import * as fijiTravellerCovidLabTestList from './covid-module/fiji/fiji-traveller-covid-lab-test-list';
import * as palauCovidSwabLabTestList from './covid-module/palau/palau-covid-swab-lab-test-list';
import * as nauruCovidSwabLabTestList from './covid-module/nauru/nauru-covid-swab-lab-test-list';
import * as kiribatiCovidSwabLabTestList from './covid-module/kiribati/kiribati-covid-swab-lab-test-list';
import * as samoaCovidSwabLabTestList from './covid-module/samoa/samoa-covid-swab-lab-test-list';
import * as covidSwabLabTestsSummary from './covid-module/covid-swab-lab-tests-summary';
import * as indiaAssistiveTechnologyDeviceLineList from './india-assistive-technology-device-line-list';
import * as iraqAssistiveTechnologyDeviceLineList from './iraq-assistive-technology-device-line-list';
import * as pngAssistiveTechnologyDeviceLineList from './png-assistive-technology-device-line-list';
import * as encounterSummaryLineList from './encounter-summary-line-list';
import * as fijiRecentAttendanceList from './fiji-recent-attendance-list';
import * as fijiNcdPrimaryScreeningLineList from './fiji-ncd-primary-screening/fiji-ncd-primary-screening-line-list';
import * as fijiNcdPrimaryScreeningPendingReferralsLineList from './fiji-ncd-primary-screening/fiji-ncd-primary-screening-pending-referrals-line-list';
import * as fijiNcdPrimaryScreeningSummary from './fiji-ncd-primary-screening/fiji-ncd-primary-screening-summary';
import * as fijiStatisticalReportForPhisSummary from './fiji-statistical-report-for-phis-summary';
import * as palauCovidCaseReportLineList from './covid-module/palau/palau-covid-case-report-line-list';
import * as genericSurveyExportLineList from './generic-survey-export-line-list';
import * as appointmentsLineList from './appointments-line-list';
import * as imagingRequestsLineList from './imaging-requests-line-list';
import * as deceasedPatientsLineList from './deceased-patients-line-list';
import * as labRequestsLineList from './lab-requests-line-list';
import * as fijiAspenHospitalAdmissionsSummary from './fiji-aspen-hospital-admissions-summary';
import * as registeredBirthsLineList from './registered-births-line-list';

export async function getReportModule(reportId, models) {
  const dbDefinedReportModule = await models.ReportDefinitionVersion.findByPk(reportId);

  if (dbDefinedReportModule) {
    return dbDefinedReportModule;
  }

  switch (reportId) {
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
    case 'tuvalu-vaccine-list':
      return tuvaluVaccineList;
    case 'covid-vaccine-list':
      return covidVaccineList;
    case 'covid-vaccine-summary-dose1':
      return {
        dataGenerator: generateCovidVaccineSummaryDose1Report,
      };
    case 'covid-vaccine-summary-dose2':
      return {
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
    case 'fiji-covid-swab-lab-test-list':
      return fijiCovidSwabLabTestList;
    case 'fiji-traveller-covid-lab-test-list':
      return fijiTravellerCovidLabTestList;
    case 'palau-covid-swab-lab-test-list':
      return palauCovidSwabLabTestList;
    case 'nauru-covid-swab-lab-test-list':
      return nauruCovidSwabLabTestList;
    case 'kiribati-covid-swab-lab-test-list':
      return kiribatiCovidSwabLabTestList;
    case 'samoa-covid-swab-lab-test-list':
      return samoaCovidSwabLabTestList;
    case 'covid-swab-lab-tests-summary':
      return covidSwabLabTestsSummary;
    case 'india-assistive-technology-device-line-list':
      return indiaAssistiveTechnologyDeviceLineList;
    case 'iraq-assistive-technology-device-line-list':
      return iraqAssistiveTechnologyDeviceLineList;
    case 'png-assistive-technology-device-line-list':
      return pngAssistiveTechnologyDeviceLineList;
    case 'encounter-summary-line-list':
      return encounterSummaryLineList;
    case 'fiji-recent-attendance-list':
      return fijiRecentAttendanceList;
    case 'fiji-ncd-primary-screening-line-list':
      return fijiNcdPrimaryScreeningLineList;
    case 'fiji-ncd-primary-screening-pending-referrals-line-list':
      return fijiNcdPrimaryScreeningPendingReferralsLineList;
    case 'fiji-ncd-primary-screening-summary':
      return fijiNcdPrimaryScreeningSummary;
    case 'fiji-statistical-report-for-phis-summary':
      return fijiStatisticalReportForPhisSummary;
    case 'palau-covid-case-report-line-list':
      return palauCovidCaseReportLineList;
    case 'generic-survey-export-line-list':
      return genericSurveyExportLineList;
    case 'appointments-line-list':
      return appointmentsLineList;
    case 'imaging-requests-line-list':
      return imagingRequestsLineList;
    case 'deceased-patients-line-list':
      return deceasedPatientsLineList;
    case 'lab-requests-line-list':
      return labRequestsLineList;
    case 'fiji-aspen-hospital-admissions-summary':
      return fijiAspenHospitalAdmissionsSummary;
    case 'registered-births-line-list':
      return registeredBirthsLineList;
  }
}

export { REPORT_DEFINITIONS } from './reportDefinitions';
export { REPORT_OBJECTS } from './reportObjects';
