// This file is autogenerated, do not edit it directly
import { databaseSetup1661160427226 } from './1661160427226-databaseSetup';
import { updatePatientDateTimeColumns1661717539000 } from './1661717539000-updatePatientDateTimeColumns';
import { updateLabTestDate1662006885000 } from './1662006885000-updateLabTestDate';
import { updatePatientIssueDate1663564207000 } from './1663564207000-updatePatientIssueDate';
import { updatePatientEncounterDateTimeColumns1664229842000 } from './1664229842000-updatePatientEncounterDateTimeColumns';
import { alterModelsForV2Sync1663710579000 } from './1663710579000-alterModelsForV2Sync';
import { updateSurveyResponseDateTimeColumns1664475769000 } from './1664475769000-updateSurveyResponseDateTimeColumns';
import { changeCaseOfSpo21665717114000 } from './1665717114000-changeCaseOfSpo2';
import { updateLabRequestDateColumns1666171050000 } from './1666171050000-updateLabRequestDateColumns';
import { addFieldUpdateTicksToPAD1668987530000 } from './1668987530000-addFieldUpdateTicksToPAD';
import { addDefaultLastSuccessfulSyncPull1669160460000 } from './1669160460000-addDefaultLastSuccessfulSyncPull';
import { resyncPatientAdditionalData1669855692000 } from './1669855692000-resyncPatientAdditionalData';
import { wipeAllDataAndResync1675907161000 } from './1675907161000-wipeAllDataAndResync';
import { addLocationGroupTable1673396917000 } from './1673396917000-addLocationGroupTable';
import { addNoteTables1677554085000 } from './1677554085000-addNoteTables';
import { addDepartmentIdToLabRequest1676853984000 } from './1676853984000-addDepartmentIdToLabRequest';
import { addLabSampleSiteIdToLabRequest1677723905000 } from './1677723905000-addLabSampleSiteIdToLabRequest';
import { addNotGivenReasonIdColumnToAdministeredVaccineTable1678061990000 } from './1678061990000-addNotGivenReasonIdColumnToAdministeredVaccineTable';
import { addLabTestPanelTables1678397398000 } from './1678397398000-addLabTestPanelTables';
import { addSettingTable1678400759000 } from './1678400759000-addSettingTable';
import { addConsentGivenByToAdministeredVaccine1682923186000 } from './1682923186000-addConsentGivenByToAdministeredVaccine';
import { addNewColumnsToAdministeredVaccine1683596516000 } from './1683596516000-addNewColumnsToAdministeredVaccine';
import { changeDateColumnToNullableForAdministeredVaccine1683598923000 } from './1683598923000-changeDateColumnToNullableForAdministeredVaccine';
import { addDisplayIdToUsers1688428478000 } from './1688428478000-addDisplayIdToUsers';
import { addSpecimenTypeAndCollectedByToLabRequest1686083400000 } from './1686083400000-addSpecimenTypeAndCollectedByToLabRequest';
import { addVitalLogs1690236942000 } from './1690236942000-addVitalLogs';
import { migrateNotePagesToNotes1688950151000 } from './1688950151000-migrateNotePagesToNotes';
import { addEncounterHistoryTable1693484817000 } from './1693484817000-addEncounterHistoryTable';
import { addTranslatedStringTable1698353903000 } from './1698353903000-addTranslatedStringTable';
import { addVisibilityStatusToSurveyScreenComponents1695096053000 } from './1695096053000-addVisibilityStatusToSurveyScreenComponents';
import { addDeletionStatusToClinicalFeatures1698040379000 } from './1698040379000-addDeletionStatusToClinicalFeatures';
import { addVisibilityStatusForUsers1697499690000 } from './1697499690000-addVisibilityStatusForUsers';
import { addDeletedAtToAllTables1698626272000 } from './1698626272000-addDeletedAtToAllTables';
import { addPatientCustomFieldsTables1694090332843 } from './1694090332843-addPatientCustomFieldsTables';
import { addProgramRegistry1706106989000 } from './1706106989000-addProgramRegistries';
import { addPatientProgramRegistration1706144623000 } from './1706144623000-addPatientProgramRegistration';
import { addProgramRegistryClinicalStatuses1706506699000 } from './1706506699000-addProgramRegistryClinicalStatuses';
import { addProgramRegistryConditions1706507296000 } from './1706507296000-addProgramRegistryConditions';
import { addPatientProgramRegistrationConditions1706509624000 } from './1706509624000-addPatientProgramRegistrationConditions';
import { addColumnIsMostRecentForTablePatientProgramRegistration1708557002000 } from './1708557002000-addColumnIsMostRecentForTablePatientProgramRegistration';
import { addHideFromCertificateToScheduledVaccines1705264433000 } from './1705264433000-addHideFromCertificateToScheduledVaccines';
import { addDeletionStatusToPatientProgramRegistrationConditions1709677995000 } from './1709677995000-addDeletionStatusToPatientProgramRegistrationConditions';

export const migrationList = [
  databaseSetup1661160427226,
  updatePatientDateTimeColumns1661717539000,
  updateLabTestDate1662006885000,
  updatePatientIssueDate1663564207000,
  updatePatientEncounterDateTimeColumns1664229842000,
  alterModelsForV2Sync1663710579000,
  updateSurveyResponseDateTimeColumns1664475769000,
  changeCaseOfSpo21665717114000,
  updateLabRequestDateColumns1666171050000,
  addFieldUpdateTicksToPAD1668987530000,
  addDefaultLastSuccessfulSyncPull1669160460000,
  resyncPatientAdditionalData1669855692000,
  wipeAllDataAndResync1675907161000,
  addLocationGroupTable1673396917000,
  addDepartmentIdToLabRequest1676853984000,
  addLabSampleSiteIdToLabRequest1677723905000,
  addNoteTables1677554085000,
  addNotGivenReasonIdColumnToAdministeredVaccineTable1678061990000,
  addLabTestPanelTables1678397398000,
  addSettingTable1678400759000,
  addConsentGivenByToAdministeredVaccine1682923186000,
  addNewColumnsToAdministeredVaccine1683596516000,
  changeDateColumnToNullableForAdministeredVaccine1683598923000,
  addDisplayIdToUsers1688428478000,
  addSpecimenTypeAndCollectedByToLabRequest1686083400000,
  addVitalLogs1690236942000,
  migrateNotePagesToNotes1688950151000,
  addEncounterHistoryTable1693484817000,
  addTranslatedStringTable1698353903000,
  addVisibilityStatusToSurveyScreenComponents1695096053000,
  addDeletionStatusToClinicalFeatures1698040379000,
  addVisibilityStatusForUsers1697499690000,
  addDeletedAtToAllTables1698626272000,
  addPatientCustomFieldsTables1694090332843,
  addProgramRegistry1706106989000,
  addPatientProgramRegistration1706144623000,
  addProgramRegistryClinicalStatuses1706506699000,
  addProgramRegistryConditions1706507296000,
  addPatientProgramRegistrationConditions1706509624000,
  addColumnIsMostRecentForTablePatientProgramRegistration1708557002000,
  addHideFromCertificateToScheduledVaccines1705264433000,
  addDeletionStatusToPatientProgramRegistrationConditions1709677995000,
];
