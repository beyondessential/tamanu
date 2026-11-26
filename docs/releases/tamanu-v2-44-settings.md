## Global Settings

### ageDisplayFormat
- `ageDisplayFormat` — default [{"as":"days","range":{"min":{"duration":{"days":0},"excl… — Settings that apply to all servers

### appointments
- `appointments.maxRepeatingAppointmentsPerGeneration` — default 50 — Appointment settings

### audit
- `audit.accesses.enabled` — default false (high-risk) — Audit accesses
- `audit.changes.enabled` — default false (high-risk) — Audit changes

### auth
- `auth.restrictUsersToFacilities` — default false (high-risk) — Authentication options
- `auth.restrictUsersToSync` — default false (high-risk) — Authentication options

### customisations
- `customisations.componentVersions` — default {} — Customisation of the application

### features
- `features.desktopCharting.enabled` — default false — Enable desktop charting module
- `features.deviceRegistrationQuota.enabled` — default true — Device registration quota settings
- `features.disableInputPasting` — default false — Toggle features on/off
- `features.discharge.dischargeDiagnosisMandatory` — default false — Encounter discharge configuration
- `features.discharge.dischargeNoteMandatory` — default false — Encounter discharge configuration
- `features.displayIcd10CodesInDischargeSummary` — default true — Toggle features on/off
- `features.displayProcedureCodesInDischargeSummary` — default true — Toggle features on/off
- `features.editPatientDetailsOnMobile` — default true — Toggle features on/off
- `features.editPatientDisplayId` — default true — Toggle features on/off
- `features.enableAppointmentsExtentions` — default false — Toggle features on/off
- `features.enableChartingEdit` — default false — Toggle features on/off
- `features.enableCovidClearanceCertificate` — default false — Toggle features on/off
- `features.enableInvoicing` — default false — Toggle features on/off
- `features.enableNoteBackdating` — default true — Toggle features on/off
- `features.enablePatientDeaths` — default false — Toggle features on/off
- `features.enablePatientInsurer` — default false — Toggle features on/off
- `features.enableTasking` — default false — Toggle features on/off
- `features.enableVaccineConsent` — default true — Toggle features on/off
- `features.enableVitalEdit` — default false — Toggle features on/off
- `features.filterDischargeDispositions` — default false — Toggle features on/off
- `features.hideOtherSex` — default true — Toggle features on/off
- `features.hideUpcomingVaccines` — default false — Toggle features on/off
- `features.idleTimeout.enabled` — default true — Automatically logout idle users / inactive sessions after a certain time
- `features.idleTimeout.refreshInterval` — default 150 — Automatically logout idle users / inactive sessions after a certain time
- `features.idleTimeout.timeoutDuration` — default 600 — Automatically logout idle users / inactive sessions after a certain time
- `features.idleTimeout.warningPromptDuration` — default 30 — Automatically logout idle users / inactive sessions after a certain time
- `features.mandateSpecimenType` — default false — Toggle features on/off
- `features.mandatoryChartingEditReason` — default false — Toggle features on/off
- `features.mandatoryVitalEditReason` — default false — Toggle features on/off
- `features.onlyAllowLabPanels` — default false — Toggle features on/off
- `features.patientDetailsLocationHierarchy` — default false — Toggle features on/off
- `features.patientPlannedMove` — default false — Toggle features on/off
- `features.patientPortal` — default false (high-risk) — Toggle features on/off
- `features.pharmacyOrder.enabled` — default false — Pharmacy order settings
- `features.pharmacyOrder.medicationAlreadyOrderedConfirmationTimeout` — default 24 — Pharmacy order settings
- `features.quickPatientGenerator` — default false — Toggle features on/off
- `features.registerNewPatient` — default true — Toggle features on/off
- `features.reminderContactModule.enabled` — default false — Toggle features on/off
- `features.tableAutoRefresh.enabled` — default true — Enable the auto refresh feature on tables where it is implemented: Currently supports imaging and lab listing views
- `features.tableAutoRefresh.interval` — default 300 — Enable the auto refresh feature on tables where it is implemented: Currently supports imaging and lab listing views
- `features.useGlobalPdfFont` — default false — Toggle features on/off

### fhir
- `fhir.worker.assumeDroppedAfter` — default "10 minutes" — FHIR worker settings
- `fhir.worker.heartbeat` — default "1 minute" — FHIR worker settings

### fields
- `fields.age.defaultValue` — default null — _
- `fields.age.required` — default false — _
- `fields.apgarScoreFiveMinutes.defaultValue` — default null — _
- `fields.apgarScoreFiveMinutes.hidden` — default false — _
- `fields.apgarScoreFiveMinutes.required` — default false — _
- `fields.apgarScoreFiveMinutes.requiredPatientData` — default false — _
- `fields.apgarScoreOneMinute.defaultValue` — default null — _
- `fields.apgarScoreOneMinute.hidden` — default false — _
- `fields.apgarScoreOneMinute.required` — default false — _
- `fields.apgarScoreOneMinute.requiredPatientData` — default false — _
- `fields.apgarScoreTenMinutes.defaultValue` — default null — _
- `fields.apgarScoreTenMinutes.hidden` — default false — _
- `fields.apgarScoreTenMinutes.required` — default false — _
- `fields.apgarScoreTenMinutes.requiredPatientData` — default false — _
- `fields.arrivalModeId.defaultValue` — default null — _
- `fields.arrivalModeId.hidden` — default false — _
- `fields.arrivalModeId.required` — default false — _
- `fields.attendantAtBirth.defaultValue` — default null — _
- `fields.attendantAtBirth.hidden` — default false — _
- `fields.attendantAtBirth.required` — default false — _
- `fields.attendantAtBirth.requiredPatientData` — default false — _
- `fields.birthCertificate.defaultValue` — default null — _
- `fields.birthCertificate.hidden` — default false — _
- `fields.birthCertificate.required` — default false — _
- `fields.birthCertificate.requiredPatientData` — default false — _
- `fields.birthDeliveryType.defaultValue` — default null — _
- `fields.birthDeliveryType.hidden` — default false — _
- `fields.birthDeliveryType.required` — default false — _
- `fields.birthDeliveryType.requiredPatientData` — default false — _
- `fields.birthFacilityId.defaultValue` — default null — _
- `fields.birthFacilityId.hidden` — default false — _
- `fields.birthFacilityId.required` — default false — _
- `fields.birthFacilityId.requiredPatientData` — default false — _
- `fields.birthLength.defaultValue` — default null — _
- `fields.birthLength.hidden` — default false — _
- `fields.birthLength.required` — default false — _
- `fields.birthLength.requiredPatientData` — default false — _
- `fields.birthType.defaultValue` — default null — _
- `fields.birthType.hidden` — default false — _
- `fields.birthType.required` — default false — _
- `fields.birthType.requiredPatientData` — default false — _
- `fields.birthWeight.defaultValue` — default null — _
- `fields.birthWeight.hidden` — default false — _
- `fields.birthWeight.required` — default false — _
- `fields.birthWeight.requiredPatientData` — default false — _
- `fields.bloodType.defaultValue` — default null — _
- `fields.bloodType.hidden` — default false — _
- `fields.bloodType.required` — default false — _
- `fields.bloodType.requiredPatientData` — default false — _
- `fields.circumstanceId.defaultValue` — default null — _
- `fields.circumstanceId.hidden` — default false — _
- `fields.circumstanceId.required` — default false — _
- `fields.cityTown.defaultValue` — default null — _
- `fields.cityTown.hidden` — default false — _
- `fields.cityTown.required` — default false — _
- `fields.cityTown.requiredPatientData` — default false — _
- `fields.clinician.defaultValue` — default null — _
- `fields.clinician.hidden` — default false — _
- `fields.clinician.required` — default false — _
- `fields.conditions.defaultValue` — default null — _
- `fields.conditions.hidden` — default false — _
- `fields.conditions.required` — default false — _
- `fields.countryId.defaultValue` — default null — _
- `fields.countryId.hidden` — default false — _
- `fields.countryId.required` — default false — _
- `fields.countryId.requiredPatientData` — default false — _
- `fields.countryOfBirthId.defaultValue` — default null — _
- `fields.countryOfBirthId.hidden` — default false — _
- `fields.countryOfBirthId.required` — default false — _
- `fields.countryOfBirthId.requiredPatientData` — default false — _
- `fields.culturalName.defaultValue` — default null — _
- `fields.culturalName.hidden` — default false — _
- `fields.culturalName.required` — default false — _
- `fields.culturalName.requiredPatientData` — default false — _
- `fields.date.defaultValue` — default null — _
- `fields.date.required` — default false — _
- `fields.dateOfBirth.defaultValue` — default null — _
- `fields.dateOfBirth.required` — default false — _
- `fields.dateOfBirth.requiredPatientData` — default false — _
- `fields.dateOfBirthExact.defaultValue` — default null — _
- `fields.dateOfBirthExact.required` — default false — _
- `fields.dateOfBirthFrom.defaultValue` — default null — _
- `fields.dateOfBirthFrom.required` — default false — _
- `fields.dateOfBirthTo.defaultValue` — default null — _
- `fields.dateOfBirthTo.required` — default false — _
- `fields.dateOfDeath.defaultValue` — default null — _
- `fields.dateOfDeath.required` — default false — _
- `fields.diagnosis.defaultValue` — default null — _
- `fields.diagnosis.hidden` — default false — _
- `fields.diagnosis.required` — default false — _
- `fields.dischargeDisposition.defaultValue` — default null — _
- `fields.dischargeDisposition.hidden` — default false — _
- `fields.dischargeDisposition.required` — default false — _
- `fields.displayId.defaultValue` — default null — _
- `fields.displayId.pattern` — default "[\s\S]*" — _
- `fields.displayId.required` — default false — _
- `fields.divisionId.defaultValue` — default null — _
- `fields.divisionId.hidden` — default false — _
- `fields.divisionId.required` — default false — _
- `fields.divisionId.requiredPatientData` — default false — _
- `fields.drivingLicense.defaultValue` — default null — _
- `fields.drivingLicense.hidden` — default false — _
- `fields.drivingLicense.required` — default false — _
- `fields.drivingLicense.requiredPatientData` — default false — _
- `fields.educationalLevel.defaultValue` — default null — _
- `fields.educationalLevel.hidden` — default false — _
- `fields.educationalLevel.required` — default false — _
- `fields.educationalLevel.requiredPatientData` — default false — _
- `fields.email.defaultValue` — default null — _
- `fields.email.hidden` — default false — _
- `fields.email.required` — default false — _
- `fields.email.requiredPatientData` — default false — _
- `fields.emergencyContactName.defaultValue` — default null — Patients emergency contact name
- `fields.emergencyContactName.required` — default false — Patients emergency contact name
- `fields.emergencyContactName.requiredPatientData` — default false — Patients emergency contact name
- `fields.emergencyContactNumber.defaultValue` — default null — _
- `fields.emergencyContactNumber.required` — default false — _
- `fields.emergencyContactNumber.requiredPatientData` — default false — _
- `fields.ethnicityId.defaultValue` — default null — _
- `fields.ethnicityId.hidden` — default false — _
- `fields.ethnicityId.required` — default false — _
- `fields.ethnicityId.requiredPatientData` — default false — _
- `fields.facility.defaultValue` — default null — _
- `fields.facility.hidden` — default false — _
- `fields.facility.required` — default false — _
- `fields.fatherId.defaultValue` — default null — _
- `fields.fatherId.hidden` — default false — _
- `fields.fatherId.required` — default false — _
- `fields.fatherId.requiredPatientData` — default false — _
- `fields.firstName.defaultValue` — default null — _
- `fields.firstName.required` — default false — _
- `fields.firstName.requiredPatientData` — default false — _
- `fields.gestationalAgeEstimate.defaultValue` — default null — _
- `fields.gestationalAgeEstimate.hidden` — default false — _
- `fields.gestationalAgeEstimate.required` — default false — _
- `fields.gestationalAgeEstimate.requiredPatientData` — default false — _
- `fields.healthCenterId.defaultValue` — default null — _
- `fields.healthCenterId.hidden` — default false — _
- `fields.healthCenterId.required` — default false — _
- `fields.healthCenterId.requiredPatientData` — default false — _
- `fields.insurerId.defaultValue` — default null — _
- `fields.insurerId.hidden` — default false — _
- `fields.insurerId.required` — default false — _
- `fields.insurerId.requiredPatientData` — default false — _
- `fields.insurerPolicyNumber.defaultValue` — default null — _
- `fields.insurerPolicyNumber.hidden` — default false — _
- `fields.insurerPolicyNumber.required` — default false — _
- `fields.insurerPolicyNumber.requiredPatientData` — default false — _
- `fields.lastName.defaultValue` — default null — _
- `fields.lastName.required` — default false — _
- `fields.lastName.requiredPatientData` — default false — _
- `fields.locationGroupId.defaultValue` — default null — _
- `fields.locationGroupId.hidden` — default false — _
- `fields.locationGroupId.required` — default false — _
- `fields.locationId.defaultValue` — default null — _
- `fields.locationId.hidden` — default false — _
- `fields.locationId.required` — default false — _
- `fields.maritalStatus.defaultValue` — default null — _
- `fields.maritalStatus.hidden` — default false — _
- `fields.maritalStatus.required` — default false — _
- `fields.maritalStatus.requiredPatientData` — default false — _
- `fields.markedForSync.defaultValue` — default null — _
- `fields.markedForSync.required` — default false — _
- `fields.medicalAreaId.defaultValue` — default null — _
- `fields.medicalAreaId.hidden` — default false — _
- `fields.medicalAreaId.required` — default false — _
- `fields.medicalAreaId.requiredPatientData` — default false — _
- `fields.middleName.defaultValue` — default null — _
- `fields.middleName.hidden` — default false — _
- `fields.middleName.required` — default false — _
- `fields.middleName.requiredPatientData` — default false — _
- `fields.motherId.defaultValue` — default null — _
- `fields.motherId.hidden` — default false — _
- `fields.motherId.required` — default false — _
- `fields.motherId.requiredPatientData` — default false — _
- `fields.nameOfAttendantAtBirth.defaultValue` — default null — _
- `fields.nameOfAttendantAtBirth.hidden` — default false — _
- `fields.nameOfAttendantAtBirth.required` — default false — _
- `fields.nameOfAttendantAtBirth.requiredPatientData` — default false — _
- `fields.nationalityId.defaultValue` — default null — _
- `fields.nationalityId.hidden` — default false — _
- `fields.nationalityId.required` — default false — _
- `fields.nationalityId.requiredPatientData` — default false — _
- `fields.notGivenReasonId.defaultValue` — default null — _
- `fields.notGivenReasonId.hidden` — default false — _
- `fields.notGivenReasonId.required` — default false — _
- `fields.nursingZoneId.defaultValue` — default null — _
- `fields.nursingZoneId.hidden` — default false — _
- `fields.nursingZoneId.required` — default false — _
- `fields.nursingZoneId.requiredPatientData` — default false — _
- `fields.occupationId.defaultValue` — default null — _
- `fields.occupationId.hidden` — default false — _
- `fields.occupationId.required` — default false — _
- `fields.occupationId.requiredPatientData` — default false — _
- `fields.passport.defaultValue` — default null — _
- `fields.passport.hidden` — default false — _
- `fields.passport.required` — default false — _
- `fields.passport.requiredPatientData` — default false — _
- `fields.patientBillingTypeId.defaultValue` — default null — _
- `fields.patientBillingTypeId.hidden` — default false — _
- `fields.patientBillingTypeId.required` — default false — _
- `fields.patientBillingTypeId.requiredPatientData` — default false — _
- `fields.placeOfBirth.defaultValue` — default null — _
- `fields.placeOfBirth.hidden` — default false — _
- `fields.placeOfBirth.required` — default false — _
- `fields.placeOfBirth.requiredPatientData` — default false — _
- `fields.prescriber.defaultValue` — default null — _
- `fields.prescriber.hidden` — default false — _
- `fields.prescriber.required` — default false — _
- `fields.prescriberId.defaultValue` — default null — _
- `fields.prescriberId.hidden` — default false — _
- `fields.prescriberId.required` — default false — _
- `fields.primaryContactNumber.defaultValue` — default null — _
- `fields.primaryContactNumber.hidden` — default false — _
- `fields.primaryContactNumber.required` — default false — _
- `fields.primaryContactNumber.requiredPatientData` — default false — _
- `fields.programRegistry.defaultValue` — default null — _
- `fields.programRegistry.hidden` — default false — _
- `fields.programRegistry.required` — default false — _
- `fields.referralSourceId.defaultValue` — default null — _
- `fields.referralSourceId.hidden` — default false — _
- `fields.referralSourceId.required` — default false — _
- `fields.registeredBirthPlace.defaultValue` — default null — _
- `fields.registeredBirthPlace.hidden` — default false — _
- `fields.registeredBirthPlace.required` — default false — _
- `fields.registeredBirthPlace.requiredPatientData` — default false — _
- `fields.registeredBy.defaultValue` — default null — _
- `fields.registeredBy.hidden` — default false — _
- `fields.registeredBy.required` — default false — _
- `fields.religionId.defaultValue` — default null — _
- `fields.religionId.hidden` — default false — _
- `fields.religionId.required` — default false — _
- `fields.religionId.requiredPatientData` — default false — _
- `fields.reminderContactName.defaultValue` — default null — _
- `fields.reminderContactName.hidden` — default false — _
- `fields.reminderContactName.required` — default false — _
- `fields.reminderContactNumber.defaultValue` — default null — _
- `fields.reminderContactNumber.hidden` — default false — _
- `fields.reminderContactNumber.required` — default false — _
- `fields.secondaryContactNumber.defaultValue` — default null — _
- `fields.secondaryContactNumber.hidden` — default false — _
- `fields.secondaryContactNumber.required` — default false — _
- `fields.secondaryContactNumber.requiredPatientData` — default false — _
- `fields.settlementId.defaultValue` — default null — _
- `fields.settlementId.hidden` — default false — _
- `fields.settlementId.required` — default false — _
- `fields.settlementId.requiredPatientData` — default false — _
- `fields.sex.defaultValue` — default null — _
- `fields.sex.hidden` — default false — _
- `fields.sex.required` — default false — _
- `fields.sex.requiredPatientData` — default false — _
- `fields.socialMedia.defaultValue` — default null — _
- `fields.socialMedia.hidden` — default false — _
- `fields.socialMedia.required` — default false — _
- `fields.socialMedia.requiredPatientData` — default false — _
- `fields.status.defaultValue` — default null — _
- `fields.status.hidden` — default false — _
- `fields.status.required` — default false — _
- `fields.streetVillage.defaultValue` — default null — _
- `fields.streetVillage.hidden` — default false — _
- `fields.streetVillage.required` — default false — _
- `fields.streetVillage.requiredPatientData` — default false — _
- `fields.subdivisionId.defaultValue` — default null — _
- `fields.subdivisionId.hidden` — default false — _
- `fields.subdivisionId.required` — default false — _
- `fields.subdivisionId.requiredPatientData` — default false — _
- `fields.timeOfBirth.defaultValue` — default null — _
- `fields.timeOfBirth.hidden` — default false — _
- `fields.timeOfBirth.required` — default false — _
- `fields.timeOfBirth.requiredPatientData` — default false — _
- `fields.title.defaultValue` — default null — _
- `fields.title.hidden` — default false — _
- `fields.title.required` — default false — _
- `fields.title.requiredPatientData` — default false — _
- `fields.villageId.defaultValue` — default null — _
- `fields.villageId.hidden` — default false — _
- `fields.villageId.required` — default false — _
- `fields.villageId.requiredPatientData` — default false — _
- `fields.villageName.defaultValue` — default null — _
- `fields.villageName.hidden` — default false — _
- `fields.villageName.required` — default false — _

### fileChooserMbSizeLimit
- `fileChooserMbSizeLimit` — default 10 — Settings that apply to all servers

### imagingCancellationReasons
- `imagingCancellationReasons` — default [{"value":"clinical","label":"Clinical reason","hidden":f… — Settings that apply to all servers

### imagingPriorities
- `imagingPriorities` — default [{"value":"routine","label":"Routine"},{"value":"urgent",… — Settings that apply to all servers

### integrations
- `integrations.imaging.enabled` — default false — Imaging integration settings
- `integrations.imaging.provider` — default "test" — Imaging integration settings

### invoice
- `invoice.slidingFeeScale` — default [[0,5700,10050,12600,14100,17500],[0,6600,13500,16300,190… — Settings that apply to all servers

### labsCancellationReasons
- `labsCancellationReasons` — default [{"value":"clinical","label":"Clinical reason"},{"value":… — Settings that apply to all servers

### layouts
- `layouts.mobilePatientModules.diagnosisAndTreatment.hidden` — default false — _
- `layouts.mobilePatientModules.diagnosisAndTreatment.sortPriority` — default 0 — _
- `layouts.mobilePatientModules.programRegistries.hidden` — default false — _
- `layouts.mobilePatientModules.programs.hidden` — default false — _
- `layouts.mobilePatientModules.programs.sortPriority` — default 0 — _
- `layouts.mobilePatientModules.referral.hidden` — default false — _
- `layouts.mobilePatientModules.referral.sortPriority` — default 0 — _
- `layouts.mobilePatientModules.tests.hidden` — default false — _
- `layouts.mobilePatientModules.tests.sortPriority` — default 0 — _
- `layouts.mobilePatientModules.vaccine.hidden` — default false — _
- `layouts.mobilePatientModules.vaccine.sortPriority` — default 0 — _
- `layouts.mobilePatientModules.vitals.hidden` — default false — _
- `layouts.mobilePatientModules.vitals.sortPriority` — default 0 — _
- `layouts.patientTabs.details.sortPriority` — default -100 — _
- `layouts.patientTabs.documents.hidden` — default false — _
- `layouts.patientTabs.documents.sortPriority` — default 0 — _
- `layouts.patientTabs.invoices.hidden` — default false — _
- `layouts.patientTabs.invoices.sortPriority` — default 0 — _
- `layouts.patientTabs.medication.hidden` — default false — _
- `layouts.patientTabs.medication.sortPriority` — default 0 — _
- `layouts.patientTabs.programs.hidden` — default false — _
- `layouts.patientTabs.programs.sortPriority` — default 0 — _
- `layouts.patientTabs.referrals.hidden` — default false — _
- `layouts.patientTabs.referrals.sortPriority` — default 0 — _
- `layouts.patientTabs.results.hidden` — default false — _
- `layouts.patientTabs.results.sortPriority` — default 0 — _
- `layouts.patientTabs.summary.sortPriority` — default -100 — _
- `layouts.patientTabs.vaccines.hidden` — default false — _
- `layouts.patientTabs.vaccines.sortPriority` — default 0 — _
- `layouts.patientView.showLocationBookings` — default false — The patient view in the facility
- `layouts.patientView.showOutpatientAppointments` — default false — The patient view in the facility
- `layouts.sidebar.dashboard.hidden` — default false — _
- `layouts.sidebar.dashboard.sortPriority` — default 0 — _
- `layouts.sidebar.facilityAdmin.bedManagement.hidden` — default false — _
- `layouts.sidebar.facilityAdmin.bedManagement.sortPriority` — default 0 — _
- `layouts.sidebar.facilityAdmin.reports.hidden` — default false — _
- `layouts.sidebar.facilityAdmin.reports.sortPriority` — default 0 — _
- `layouts.sidebar.imaging.imagingActive.hidden` — default false — _
- `layouts.sidebar.imaging.imagingActive.sortPriority` — default 0 — _
- `layouts.sidebar.imaging.imagingCompleted.hidden` — default false — _
- `layouts.sidebar.imaging.imagingCompleted.sortPriority` — default 0 — _
- `layouts.sidebar.immunisations.immunisationsAll.hidden` — default false — _
- `layouts.sidebar.immunisations.immunisationsAll.sortPriority` — default 0 — _
- `layouts.sidebar.labs.labsAll.hidden` — default false — _
- `layouts.sidebar.labs.labsAll.sortPriority` — default 0 — _
- `layouts.sidebar.labs.labsPublished.hidden` — default false — _
- `layouts.sidebar.labs.labsPublished.sortPriority` — default 0 — _
- `layouts.sidebar.patients.patientsEmergency.hidden` — default false — _
- `layouts.sidebar.patients.patientsEmergency.sortPriority` — default 0 — _
- `layouts.sidebar.patients.patientsInpatients.hidden` — default false — _
- `layouts.sidebar.patients.patientsInpatients.sortPriority` — default 0 — _
- `layouts.sidebar.patients.patientsOutpatients.hidden` — default false — _
- `layouts.sidebar.patients.patientsOutpatients.sortPriority` — default 0 — _
- `layouts.sidebar.scheduling.schedulingLocations.hidden` — default false — _
- `layouts.sidebar.scheduling.schedulingLocations.sortPriority` — default 0 — _
- `layouts.sidebar.scheduling.schedulingOutpatients.hidden` — default false — _
- `layouts.sidebar.scheduling.schedulingOutpatients.sortPriority` — default 0 — _

### locationAssignments
- `locationAssignments.assignmentMaxFutureMonths` — default 24 — Location assignment settings

### medications
- `medications.defaultAdministrationTimes.Daily` — default ["06:00"] — -
- `medications.defaultAdministrationTimes.Daily at midday` — default ["12:00"] — -
- `medications.defaultAdministrationTimes.Daily at night` — default ["18:00"] — -
- `medications.defaultAdministrationTimes.Daily in the morning` — default ["06:00"] — -
- `medications.defaultAdministrationTimes.Every 4 hours` — default ["02:00","06:00","10:00","14:00","18:00","22:00"] — -
- `medications.defaultAdministrationTimes.Every 6 hours` — default ["00:00","06:00","12:00","18:00"] — -
- `medications.defaultAdministrationTimes.Every 8 hours` — default ["06:00","14:00","22:00"] — -
- `medications.defaultAdministrationTimes.Every second day` — default ["06:00"] — -
- `medications.defaultAdministrationTimes.Four times daily` — default ["06:00","12:00","18:00","22:00"] — -
- `medications.defaultAdministrationTimes.Once a month` — default ["06:00"] — -
- `medications.defaultAdministrationTimes.Once a week` — default ["06:00"] — -
- `medications.defaultAdministrationTimes.Three times daily` — default ["06:00","12:00","18:00"] — -
- `medications.defaultAdministrationTimes.Twice daily - AM and midday` — default ["06:00","12:00"] — -
- `medications.defaultAdministrationTimes.Two times daily` — default ["06:00","18:00"] — -
- `medications.frequenciesEnabled.As directed` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Daily` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Daily at midday` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Daily at night` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Daily in the morning` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Every 4 hours` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Every 6 hours` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Every 8 hours` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Every second day` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Four times daily` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Immediately` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Once a month` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Once a week` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Three times daily` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Twice daily - AM and midday` — default true — Enable medication frequencies
- `medications.frequenciesEnabled.Two times daily` — default true — Enable medication frequencies

### notifications
- `notifications.recentNotificationsTimeFrame` — default 48 — Notification settings

### printMeasures
- `printMeasures.idCardPage.cardMarginLeft` — default 5 — The ID card found on the patient view
- `printMeasures.idCardPage.cardMarginTop` — default 1 — The ID card found on the patient view
- `printMeasures.labRequestPrintLabel.width` — default 50.8 — Lab request label with basic info + barcode
- `printMeasures.stickerLabelPage.columnGap` — default 3.01 — The multiple ID labels printout on the patient view
- `printMeasures.stickerLabelPage.columnWidth` — default 64 — The multiple ID labels printout on the patient view
- `printMeasures.stickerLabelPage.pageHeight` — default 297 — The multiple ID labels printout on the patient view
- `printMeasures.stickerLabelPage.pageMarginLeft` — default 6.4 — The multiple ID labels printout on the patient view
- `printMeasures.stickerLabelPage.pageMarginTop` — default 15.09 — The multiple ID labels printout on the patient view
- `printMeasures.stickerLabelPage.pageWidth` — default 210 — The multiple ID labels printout on the patient view
- `printMeasures.stickerLabelPage.rowGap` — default 0 — The multiple ID labels printout on the patient view
- `printMeasures.stickerLabelPage.rowHeight` — default 26.7 — The multiple ID labels printout on the patient view

### security
- `security.loginAttempts.lockoutDuration` — default 10 (high-risk) — Login attempts settings
- `security.loginAttempts.lockoutThreshold` — default 10 (high-risk) — Login attempts settings
- `security.loginAttempts.observationWindow` — default 10 (high-risk) — Login attempts settings
- `security.mobile.allowUnencryptedStorage` — default true (high-risk) — Mobile security settings
- `security.mobile.allowUnprotected` — default true (high-risk) — Mobile security settings
- `security.reportNoUserError` — default false (high-risk) — Security settings

### templates
- `templates.appointmentConfirmation.body` — default "Hi $firstName$ $lastName$,

 This is a confirma…" — The email sent to confirm an appointment
- `templates.appointmentConfirmation.subject` — default "Appointment confirmation" — The email sent to confirm an appointment
- `templates.covidClearanceCertificateEmail.body` — default "A COVID-19 clearance certificate has been gener…" — Certificate containing the list of COVID tests for this patient used for proof of over 13 days since infection
- `templates.covidClearanceCertificateEmail.subject` — default "COVID-19 Clearance Certificate now available" — Certificate containing the list of COVID tests for this patient used for proof of over 13 days since infection
- `templates.covidTestCertificate.clearanceCertRemark` — default "This notice certifies that $firstName$ $lastNam…" — Certificate containing the list of COVID vaccines for this patient
- `templates.covidTestCertificate.laboratoryName` — default "Approved test provider" — Certificate containing the list of COVID vaccines for this patient
- `templates.covidTestCertificateEmail.body` — default "A medical certificate has been generated for yo…" — Email with certificate containing the list of COVID tests for this patient
- `templates.covidTestCertificateEmail.subject` — default "Medical Certificate now available" — Email with certificate containing the list of COVID tests for this patient
- `templates.covidVaccineCertificateEmail.body` — default "A medical certificate has been generated for yo…" — The email containing COVID patient vaccine certificate
- `templates.covidVaccineCertificateEmail.subject` — default "Medical Certificate now available" — The email containing COVID patient vaccine certificate
- `templates.letterhead.subTitle` — default "PO Box 12345, Melbourne, Australia" — The text at the top of most patient PDFs
- `templates.letterhead.title` — default "TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES" — The text at the top of most patient PDFs
- `templates.patientPortalLoginEmail.body` — default "Your 6-digit login code for Tamanu Patient Port…" — The email sent to the patient with their login code
- `templates.patientPortalLoginEmail.subject` — default "Your Tamanu Patient Portal Login Code" — The email sent to the patient with their login code
- `templates.patientPortalRegisteredFormEmail.body` — default "A new patient form request has been sent from $…" — The email sent to a registered patient to complete a form
- `templates.patientPortalRegisteredFormEmail.subject` — default "New Patient Form Request from $facilityName$" — The email sent to a registered patient to complete a form
- `templates.patientPortalRegistrationEmail.body` — default "Please follow the link below to complete Tamanu…" — The email sent to the patient to register for the patient portal
- `templates.patientPortalRegistrationEmail.subject` — default "Tamanu Patient Portal Registration" — The email sent to the patient to register for the patient portal
- `templates.patientPortalUnregisteredFormEmail.body` — default "A new patient form request has been sent from $…" — The email sent to an unregistered patient to complete a form
- `templates.patientPortalUnregisteredFormEmail.subject` — default "New Patient Form Request from $facilityName$" — The email sent to an unregistered patient to complete a form
- `templates.plannedMoveTimeoutHours` — default 24 — Strings to be inserted into emails/PDFs
- `templates.signerRenewalEmail.body` — default "Please sign the following certificate signing r…" — The email sent when the signer runs out
- `templates.signerRenewalEmail.subject` — default "Tamanu ICAO Certificate Signing Request" — The email sent when the signer runs out
- `templates.vaccineCertificate.contactNumber` — default "12345" — Certificate containing the list of vaccines for this patient
- `templates.vaccineCertificate.emailAddress` — default "tamanu@health.gov" — Certificate containing the list of vaccines for this patient
- `templates.vaccineCertificate.healthFacility` — default "State level" — Certificate containing the list of vaccines for this patient
- `templates.vaccineCertificateEmail.body` — default "A medical certificate has been generated for yo…" — The email containing patient vaccine certificate
- `templates.vaccineCertificateEmail.subject` — default "Medical Certificate now available" — The email containing patient vaccine certificate

### triageCategories
- `triageCategories` — default [{"level":1,"label":"Emergency","color":"#F76853"},{"leve… — Settings that apply to all servers

### upcomingVaccinations
- `upcomingVaccinations.ageLimit` — default 15 — Settings related to upcoming vaccinations
- `upcomingVaccinations.thresholds` — default [{"threshold":28,"status":"SCHEDULED"},{"threshold":7,"st… — Settings related to upcoming vaccinations

### vitalEditReasons
- `vitalEditReasons` — default [{"value":"incorrect-patient","label":"Incorrect patient"… — Settings that apply to all servers


## Central Settings

### disk
- `disk.freeSpaceRequired.gigabytesForUploadingDocuments` — default 16 — Settings related to free disk space required during uploads

### integrations
- `integrations.dhis2.backoff.maxAttempts` — default 15 — Backoff settings
- `integrations.dhis2.backoff.maxWaitMs` — default 10000 — Backoff settings
- `integrations.dhis2.backoff.multiplierMs` — default 300 — Backoff settings
- `integrations.dhis2.host` — default "" — DHIS2 settings
- `integrations.dhis2.idSchemes.categoryOptionComboIdScheme` — default "uid" — The ID schemes to use for the reports
- `integrations.dhis2.idSchemes.dataElementIdScheme` — default "uid" — The ID schemes to use for the reports
- `integrations.dhis2.idSchemes.dataSetIdScheme` — default "uid" — The ID schemes to use for the reports
- `integrations.dhis2.idSchemes.idScheme` — default "uid" — The ID schemes to use for the reports
- `integrations.dhis2.idSchemes.orgUnitIdScheme` — default "uid" — The ID schemes to use for the reports
- `integrations.dhis2.reportIds` — default [] — DHIS2 settings

### locationAssignments
- `locationAssignments.assignmentSlots.endTime` — default "17:00" — Configure the available time slots for assigning locations to users
- `locationAssignments.assignmentSlots.slotDuration` — default "30min" — Configure the available time slots for assigning locations to users
- `locationAssignments.assignmentSlots.startTime` — default "09:00" — Configure the available time slots for assigning locations to users

### mobileSync
- `mobileSync.dynamicLimiter.initialLimit` — default 10000 (high-risk) — Settings for the sync page size dynamic limiter
- `mobileSync.dynamicLimiter.maxLimit` — default 40000 (high-risk) — Settings for the sync page size dynamic limiter
- `mobileSync.dynamicLimiter.maxLimitChangePerPage` — default 0.3 (high-risk) — Settings for the sync page size dynamic limiter
- `mobileSync.dynamicLimiter.minLimit` — default 1000 (high-risk) — Settings for the sync page size dynamic limiter
- `mobileSync.dynamicLimiter.optimalTimePerPage` — default 10000 (high-risk) — Settings for the sync page size dynamic limiter
- `mobileSync.maxBatchesToKeepInMemory` — default 5 (high-risk) — Settings related to mobile sync
- `mobileSync.maxRecordsPerInsertBatch` — default 2000 (high-risk) — Settings related to mobile sync
- `mobileSync.maxRecordsPerSnapshotBatch` — default 1000 (high-risk) — Settings related to mobile sync
- `mobileSync.maxRecordsPerUpdateBatch` — default 2000 (high-risk) — Settings related to mobile sync
- `mobileSync.useUnsafeSchemaForInitialSync` — default true (high-risk) — Settings related to mobile sync

### questionCodeIds
- `questionCodeIds.email` — default null (deprecated) — Avoid using questionCodeIds. The PatientData question type has made this setting redundant.
- `questionCodeIds.nationalityId` — default null (deprecated) — Avoid using questionCodeIds. The PatientData question type has made this setting redundant.
- `questionCodeIds.passport` — default null (deprecated) — Avoid using questionCodeIds. The PatientData question type has made this setting redundant.

### reportProcess
- `reportProcess.childProcessEnv` — default null — Settings that apply only to a central server
- `reportProcess.processOptions` — default null — Settings that apply only to a central server
- `reportProcess.runInChildProcess` — default true — Settings that apply only to a central server
- `reportProcess.sleepAfterReport.duration` — default "5m" — To mitigate resource-hungry reports affecting operational use of Tamanu, if a report takes too long, then report generation can be suspended for a some time
- `reportProcess.sleepAfterReport.ifRunAtLeast` — default "5m" — To mitigate resource-hungry reports affecting operational use of Tamanu, if a report takes too long, then report generation can be suspended for a some time
- `reportProcess.timeOutDurationSeconds` — default 7200 — Settings that apply only to a central server

### sync
- `sync.streaming.databasePollBatchSize` — default 100 (high-risk) — Settings related to sync
- `sync.streaming.databasePollInterval` — default 1000 (high-risk) — Settings related to sync
- `sync.streaming.enabled` — default false (high-risk) — Settings related to sync


## Facility Settings

### appointments
- `appointments.bookingSlots.endTime` — default "17:00" — Configure the available booking slots for appointments
- `appointments.bookingSlots.slotDuration` — default "30min" — Configure the available booking slots for appointments
- `appointments.bookingSlots.startTime` — default "09:00" — Configure the available booking slots for appointments

### certifications
- `certifications.covidClearanceCertificate.after` — default "2022-09-01" — Settings that apply only to a facility server
- `certifications.covidClearanceCertificate.daysSinceSampleTime` — default 13 — Settings that apply only to a facility server
- `certifications.covidClearanceCertificate.labTestCategories` — default [] — Settings that apply only to a facility server
- `certifications.covidClearanceCertificate.labTestResults` — default ["Positive"] — Settings that apply only to a facility server
- `certifications.covidClearanceCertificate.labTestTypes` — default [] — Settings that apply only to a facility server

### questionCodeIds
- `questionCodeIds.email` — default null (deprecated) — Avoid using questionCodeIds. The PatientData question type has made this setting redundant.
- `questionCodeIds.nationalityId` — default "pde-PalauCOVSamp7" (deprecated) — Avoid using questionCodeIds. The PatientData question type has made this setting redundant.
- `questionCodeIds.passport` — default "pde-FijCOVRDT005" (deprecated) — Avoid using questionCodeIds. The PatientData question type has made this setting redundant.

### survey
- `survey.defaultCodes.department` — default "GeneralClinic" — Default reference data codes to use when creating a survey encounter (includes vitals) when none are explicitly specified
- `survey.defaultCodes.location` — default "GeneralClinic" — Default reference data codes to use when creating a survey encounter (includes vitals) when none are explicitly specified

### sync
- `sync.syncAllLabRequests` — default false (high-risk) — Facility sync settings
- `sync.urgentIntervalInSeconds` — default 10 (high-risk) — Facility sync settings

### templates
- `templates.letterhead.subTitle` — default "PO Box 12345, Melbourne, Australia" — The text at the top of most patient PDFs
- `templates.letterhead.title` — default "TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES" — The text at the top of most patient PDFs

### vaccinations
- `vaccinations.defaults.departmentId` — default null — _
- `vaccinations.defaults.locationGroupId` — default null — _
- `vaccinations.defaults.locationId` — default null — _
- `vaccinations.givenElsewhere.defaults.departmentId` — default null — _
- `vaccinations.givenElsewhere.defaults.locationGroupId` — default null — _
- `vaccinations.givenElsewhere.defaults.locationId` — default null — _
