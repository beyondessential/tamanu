import waitForExpect from 'wait-for-expect';

import { fake } from '@tamanu/fake-data/fake';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
  PATIENT_FIELD_DEFINITION_TYPES,
  NOTE_RECORD_TYPES,
  REPORT_DB_SCHEMAS,
  REPORT_STATUSES,
  SETTINGS_SCOPES,
  FACT_CURRENT_SYNC_TICK,
  FACT_LOOKUP_UP_TO_TICK,
} from '@tamanu/constants';
import { fakeUUID } from '@tamanu/utils/generateId';
import {
  getModelsForPull,
  findSyncSnapshotRecordsOrderByDependency,
  createSnapshotTable,
  dropMarkedForSyncPatientsTable,
  SYNC_SESSION_DIRECTION,
} from '@tamanu/database/sync';

import { CentralSyncManager } from '../../dist/sync/CentralSyncManager';
import { createTestContext } from '../utilities';
import { getPatientLinkedModels } from '../../dist/sync/getPatientLinkedModels';
import { createMarkedForSyncPatientsTable } from '../../dist/sync/createMarkedForSyncPatientsTable';
import { snapshotOutgoingChanges } from '../../dist/sync/snapshotOutgoingChanges';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

describe('Sync Lookup data', () => {
  let ctx;
  let models;
  let centralSyncManager;
  let sessionId;
  let facility;
  let facility2;
  let patient;
  let department;
  let department2;
  let examiner;
  let location;
  let location2;
  let labRequest1;
  let labTestPanel1;
  let labRequestAttachment1;
  let labRequestLog1;
  let labTest1;
  let labTestPanelRequest1;
  let encounter1;

  const SINCE = 1;

  const simplestSessionConfig = {
    syncAllLabRequests: false,
    isMobile: false,
  };

  const simplestConfig = {
    sync: {
      lookupTable: {
        enabled: true,
        avoidRepull: true,
      },
      maxRecordsPerSnapshotChunk: 10000000,
    },
  };

  const prepareData = async () => {
    const {
      Asset,
      PatientFieldDefinitionCategory,
      Program,
      ProgramDataElement,
      ProgramRegistry,
      ProgramRegistryClinicalStatus,
      ProgramRegistryCondition,
      ProgramRegistryConditionCategory,
      ReferenceData,
      ReferenceDataRelation,
      ReportDefinition,
      Role,
      ScheduledVaccine,
      Survey,
      SurveyScreenComponent,
      TranslatedString,
      User,
      UserPreference,
      CertifiableVaccine,
      Facility,
      ImagingAreaExternalCode,
      LabTestPanel,
      LabTestType,
      LocationGroup,
      Patient,
      PatientAdditionalData,
      PatientAllergy,
      PatientBirthData,
      PatientCarePlan,
      PatientCondition,
      PatientContact,
      PatientDeathData,
      PatientFamilyHistory,
      PatientFieldDefinition,
      PatientFieldValue,
      PatientIssue,
      PatientProgramRegistration,
      PatientProgramRegistrationCondition,
      PatientSecondaryId,
      PortalSurveyAssignment,
      Permission,
      ReportDefinitionVersion,
      Setting,
      Template,
      UserFacility,
      ContributingDeathCause,
      Department,
      InvoiceProduct,
      LabTestPanelLabTestTypes,
      Location,
      Appointment,
      AppointmentSchedule,
      AppointmentProcedureType,
      Encounter,
      EncounterDiagnosis,
      EncounterDiet,
      EncounterHistory,
      EncounterPrescription,
      PatientOngoingPrescription,
      PharmacyOrder,
      PharmacyOrderPrescription,
      MedicationDispense,
      Prescription,
      ImagingRequest,
      ImagingRequestArea,
      ImagingResult,
      Invoice,
      InvoiceDiscount,
      InvoiceInsurancePlan,
      InvoicesInvoiceInsurancePlan,
      InvoiceItem,
      InvoiceItemDiscount,
      InvoicePayment,
      LabTestPanelRequest,
      Procedure,
      ProcedureAssistantClinician,
      ProcedureSurveyResponse,
      SurveyResponse,
      SurveyResponseAnswer,
      Triage,
      VitalLog,
      Vitals,
      AdministeredVaccine,
      Discharge,
      DocumentMetadata,
      InvoiceInsurerPayment,
      InvoicePatientPayment,
      LabRequest,
      LabRequestAttachment,
      LabRequestLog,
      LabTest,
      Note,
      Referral,
      Task,
      TaskDesignation,
      TaskTemplate,
      TaskTemplateDesignation,
      UserDesignation,
      Notification,
      EncounterPausePrescription,
      EncounterPausePrescriptionHistory,
      MedicationAdministrationRecord,
      MedicationAdministrationRecordDose,
    } = models;

    await Asset.create(fake(Asset), {
      data: Buffer.from('test'),
    });
    const referenceData = await ReferenceData.create(fake(ReferenceData));
    await ReferenceDataRelation.create(fake(ReferenceDataRelation));
    const category = await PatientFieldDefinitionCategory.create(
      fake(PatientFieldDefinitionCategory),
    );
    const patientFieldDefinition = await PatientFieldDefinition.create(
      fake(PatientFieldDefinition, {
        categoryId: category.id,
        fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
      }),
    );
    const role = await Role.create(fake(Role));
    await TranslatedString.create(fake(TranslatedString));
    await CertifiableVaccine.create(fake(CertifiableVaccine, { vaccineId: referenceData.id }));
    await ImagingAreaExternalCode.create(
      fake(ImagingAreaExternalCode, { areaId: referenceData.id }),
    );

    await Setting.create(fake(Setting));
    await Template.create(fake(Template));

    examiner = await User.create(fake(User));
    patient = await Patient.create(fake(Patient));
    facility = await Facility.create(fake(Facility));
    department = await Department.create(
      fake(Department, {
        facilityId: facility.id,
      }),
    );
    const locationGroup = await LocationGroup.create(
      fake(LocationGroup, {
        facilityId: facility.id,
      }),
    );
    location = await Location.create(
      fake(Location, {
        facilityId: facility.id,
        locationGroupId: locationGroup.id,
      }),
    );
    facility2 = await Facility.create(fake(Facility));
    department2 = await Department.create(
      fake(Department, {
        facilityId: facility2.id,
      }),
    );
    const locationGroup2 = await LocationGroup.create(
      fake(LocationGroup, {
        facilityId: facility2.id,
      }),
    );
    location2 = await Location.create(
      fake(Location, {
        facilityId: facility2.id,
        locationGroupId: locationGroup2.id,
      }),
    );

    await UserFacility.create({
      userId: examiner.id,
      facilityId: facility.id,
    });
    await PatientFamilyHistory.create(fake(PatientFamilyHistory, { patientId: patient.id }));
    await PatientCondition.create(fake(PatientCondition, { patientId: patient.id }));
    await PatientCarePlan.create(fake(PatientCarePlan, { patientId: patient.id }));
    await PatientContact.create(
      fake(PatientContact, { patientId: patient.id, relationshipId: referenceData.id }),
    );
    await PatientFieldValue.create(
      fake(PatientFieldValue, { patientId: patient.id, definitionId: patientFieldDefinition.id }),
    );
    await PatientIssue.create(fake(PatientIssue, { patientId: patient.id }));
    await PatientSecondaryId.create(
      fake(PatientSecondaryId, { patientId: patient.id, typeId: referenceData.id }),
    );
    await Permission.create(fake(Permission, { roleId: role.id }));
    const schedule = await AppointmentSchedule.create(fake(AppointmentSchedule));
    const appointment = await Appointment.create(
      fake(Appointment, {
        patientId: patient.id,
        locationGroupId: locationGroup.id,
        scheduleId: schedule.id,
      }),
    );
    const procedureType = await ReferenceData.create(
      fake(ReferenceData, {
        type: 'procedureType',
      }),
    );
    await AppointmentProcedureType.create(
      fake(AppointmentProcedureType, {
        appointmentId: appointment.id,
        procedureTypeId: procedureType.id,
      }),
    );
    encounter1 = await Encounter.create(
      fake(Encounter, {
        patientId: patient.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: examiner.id,
        startDate: '2023-12-21T04:59:51.851Z',
      }),
    );
    await Discharge.create(
      fake(Discharge, {
        encounterId: encounter1.id,
        dischargerId: examiner.id,
      }),
    );
    await EncounterHistory.create(
      fake(EncounterHistory, {
        examinerId: examiner.id,
        encounterId: encounter1.id,
        departmentId: department.id,
        locationId: location.id,
      }),
    );
    await EncounterDiet.create(
      fake(EncounterDiet, {
        encounterId: encounter1.id,
        dietId: referenceData.id,
      }),
    );
    const prescription = await Prescription.create(
      fake(Prescription, {
        medicationId: referenceData.id,
      }),
    );
    const encounterPrescription = await EncounterPrescription.create(
      fake(EncounterPrescription, {
        encounterId: encounter1.id,
        prescriptionId: prescription.id,
      }),
    );

    await EncounterPausePrescription.create(
      fake(EncounterPausePrescription, {
        encounterPrescriptionId: encounterPrescription.id,
      }),
    );

    await EncounterPausePrescriptionHistory.create(
      fake(EncounterPausePrescriptionHistory, {
        encounterPrescriptionId: encounterPrescription.id,
      }),
    );

    await PatientOngoingPrescription.create(
      fake(PatientOngoingPrescription, {
        patientId: patient.id,
        prescriptionId: prescription.id,
      }),
    );

    const mar = await MedicationAdministrationRecord.create(
      fake(models.MedicationAdministrationRecord, {
        prescriptionId: prescription.id,
        recordedByUserId: examiner.id,
      }),
    );

    await MedicationAdministrationRecordDose.create(
      fake(models.MedicationAdministrationRecordDose, {
        marId: mar.id,
        givenByUserId: examiner.id,
        recordedByUserId: examiner.id,
      }),
    );

    const pharmacyOrder = await PharmacyOrder.create(
      fake(PharmacyOrder, {
        encounterId: encounter1.id,
        orderingClinicianId: examiner.id,
        facilityId: facility.id,
        date: getCurrentDateTimeString(),
      }),
    );

    const pharmacyOrderPrescription = await PharmacyOrderPrescription.create(
      fake(PharmacyOrderPrescription, {
        pharmacyOrderId: pharmacyOrder.id,
        prescriptionId: prescription.id,
      }),
    );

    await MedicationDispense.create(
      fake(MedicationDispense, {
        pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
        dispensedByUserId: examiner.id,
      }),
    );

    const imagingRequest = await ImagingRequest.create(
      fake(ImagingRequest, {
        encounterId: encounter1.id,
        requestedById: examiner.id,
      }),
    );
    await ImagingRequestArea.create(
      fake(models.ImagingRequestArea, {
        areaId: referenceData.id,
        imagingRequestId: imagingRequest.id,
      }),
    );

    await ImagingResult.create(
      fake(ImagingResult, {
        imagingRequestId: imagingRequest.id,
        externalCode: 'ACCESSION',
      }),
    );

    await Note.create(
      fake(Note, {
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter1.id,
        authorId: examiner.id,
      }),
    );
    await PatientBirthData.create(
      fake(PatientBirthData, {
        patientId: patient.id,
        facilityId: facility.id,
      }),
    );
    const programDataElement = await ProgramDataElement.create(fake(ProgramDataElement));

    const survey = await Survey.create(fake(Survey));
    await SurveyScreenComponent.create(
      fake(SurveyScreenComponent, {
        surveyId: survey.id,
        option: '{"foo":"bar"}',
        config: '{"source": "ReferenceData", "where": {"type": "facility"}}',
      }),
    );
    await PortalSurveyAssignment.create(
      fake(PortalSurveyAssignment, {
        patientId: patient.id,
        surveyId: survey.id,
        assignedById: examiner.id,
        facilityId: facility.id,
      }),
    );
    const surveyResponse = await SurveyResponse.create(
      fake(SurveyResponse, {
        surveyId: survey.id,
        encounterId: encounter1.id,
      }),
    );

    const answer = await SurveyResponseAnswer.create({
      ...fake(SurveyResponseAnswer),
      dataElementId: programDataElement.id,
      responseId: surveyResponse.id,
      body: 'test',
    });

    const reportDefinition = await ReportDefinition.create(
      fake(ReportDefinition, {
        dbSchema: REPORT_DB_SCHEMAS.REPORTING,
      }),
    );
    await ReportDefinitionVersion.create(
      fake(ReportDefinitionVersion, {
        status: REPORT_STATUSES.DRAFT,
        queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
        reportDefinitionId: reportDefinition.id,
        userId: examiner.id,
      }),
    );

    labRequest1 = await LabRequest.create(
      fake(LabRequest, {
        departmentId: department.id,
        collectedById: examiner.id,
        encounterId: encounter1.id,
      }),
    );
    labTestPanel1 = await models.LabTestPanel.create(fake(LabTestPanel));
    labTestPanelRequest1 = await LabTestPanelRequest.create(
      fake(LabTestPanelRequest, {
        encounterId: encounter1.id,
        labTestPanelId: labTestPanel1.id,
      }),
    );
    labRequestLog1 = await LabRequestLog.create(
      fake(LabRequestLog, {
        status: 'reception_pending',
        labRequestId: labRequest1.id,
      }),
    );
    const labTestType = await LabTestType.create(
      fake(LabTestType, {
        labTestCategoryId: referenceData.id,
      }),
    );
    labTest1 = await LabTest.create(
      fake(LabTest, {
        labRequestId: labRequest1.id,
        categoryId: referenceData.id,
        labTestMethodId: referenceData.id,
        labTestTypeId: labTestType.id,
      }),
    );
    labRequestAttachment1 = await LabRequestAttachment.create(
      fake(LabRequestAttachment, {
        labRequestId: labRequest1.id,
      }),
    );
    await LabTestPanelLabTestTypes.create({
      labTestPanelId: labTestPanel1.id,
      labTestTypeId: labTestType.id,
    });
    const procedure = await Procedure.create(
      fake(Procedure, {
        encounterId: encounter1.id,
      }),
    );
    await ProcedureAssistantClinician.create(
      fake(ProcedureAssistantClinician, {
        procedureId: procedure.id,
        userId: examiner.id,
      }),
    );

    await ProcedureSurveyResponse.create({
      procedureId: procedure.id,
      surveyResponseId: surveyResponse.id,
    });

    // work around as Triage.create needs config.serverFacilityId which is not available in central
    await Triage.upsert({
      encounterId: encounter1.id,
      patientId: patient.id,
      departmentId: department.id,
      facilityId: facility.id,
    });
    await Vitals.create(
      fake(Vitals, {
        encounterId: encounter1.id,
      }),
    );
    await models.DocumentMetadata.create(
      fake(DocumentMetadata, {
        encounterId: encounter1.id,
      }),
    );
    await models.Referral.create(
      fake(Referral, {
        initiatingEncounterId: encounter1.id,
        referredFacility: 'Test facility',
      }),
    );
    await UserPreference.create(
      fake(UserPreference, {
        userId: examiner.id,
      }),
    );
    const program = await Program.create(fake(Program));
    const programRegistry = await ProgramRegistry.create(
      fake(ProgramRegistry, {
        programId: program.id,
      }),
    );
    await ProgramRegistryClinicalStatus.create(
      fake(ProgramRegistryClinicalStatus, {
        programRegistryId: programRegistry.id,
      }),
    );
    const registration = await PatientProgramRegistration.create(
      fake(PatientProgramRegistration, {
        clinicianId: examiner.id,
        patientId: patient.id,
        programRegistryId: programRegistry.id,
      }),
    );
    const condition = await ProgramRegistryCondition.create(
      fake(ProgramRegistryCondition, {
        programRegistryId: programRegistry.id,
      }),
    );
    const categoryCode = PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN;
    const conditionCategory = await ProgramRegistryConditionCategory.create(
      fake(ProgramRegistryConditionCategory, {
        id: `program-registry-condition-category-${programRegistry.id}-${categoryCode}`,
        code: categoryCode,
        name: PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[categoryCode],
        programRegistryId: programRegistry.id,
      }),
    );
    await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientProgramRegistrationId: registration.id,
        programRegistryConditionId: condition.id,
        programRegistryConditionCategoryId: conditionCategory.id,
      }),
    );
    await PatientAllergy.create(
      fake(PatientAllergy, {
        patientId: patient.id,
      }),
    );
    await PatientAdditionalData.create(
      fake(PatientAdditionalData, {
        patientId: patient.id,
      }),
    );
    const pdd = await PatientDeathData.create(
      fake(PatientDeathData, {
        patientId: patient.id,
        clinicianId: examiner.id,
      }),
    );
    await ContributingDeathCause.create(
      fake(ContributingDeathCause, {
        patientDeathDataId: pdd.id,
        conditionId: referenceData.id,
      }),
    );
    await VitalLog.create(
      fake(VitalLog, {
        recordedById: examiner.id,
        answerId: answer.id,
      }),
    );
    const scheduledVaccine = await models.ScheduledVaccine.create(
      fake(ScheduledVaccine, {
        vaccineId: referenceData.id,
      }),
    );
    await models.AdministeredVaccine.create(
      fake(AdministeredVaccine, {
        scheduledVaccineId: scheduledVaccine.id,
        encounterId: encounter1.id,
      }),
    );

    await EncounterDiagnosis.create(
      fake(EncounterDiagnosis, {
        diagnosisId: referenceData.id,
        encounterId: encounter1.id,
      }),
    );
    const invoice = await Invoice.create(
      fake(Invoice, {
        encounterId: encounter1.id,
      }),
    );
    await InvoiceDiscount.create(
      fake(InvoiceDiscount, {
        invoiceId: invoice.id,
        appliedByUserId: examiner.id,
      }),
    );
    const contract = await InvoiceInsurancePlan.create(fake(InvoiceInsurancePlan));
    await InvoicesInvoiceInsurancePlan.create(
      fake(InvoicesInvoiceInsurancePlan, {
        invoiceId: invoice.id,
        invoiceInsurancePlanId: contract.id,
      }),
    );
    const invoicePayment = await InvoicePayment.create(
      fake(InvoicePayment, {
        invoiceId: invoice.id,
      }),
    );
    await InvoiceInsurerPayment.create(
      fake(InvoiceInsurerPayment, {
        invoicePaymentId: invoicePayment.id,
        insurerId: referenceData.id,
      }),
    );
    await InvoicePatientPayment.create(
      fake(InvoicePatientPayment, {
        invoicePaymentId: invoicePayment.id,
        methodId: referenceData.id,
      }),
    );
    const invoiceProduct = await InvoiceProduct.create(
      fake(InvoiceProduct, {
        id: referenceData.id,
      }),
    );
    const invoiceItem = await InvoiceItem.create(
      fake(InvoiceItem, {
        invoiceId: invoice.id,
        productId: invoiceProduct.id,
        orderedByUserId: examiner.id,
      }),
    );
    await InvoiceItemDiscount.create(
      fake(InvoiceItemDiscount, {
        invoiceItemId: invoiceItem.id,
      }),
    );

    const task = await Task.create(
      fake(Task, {
        encounterId: encounter1.id,
        requestedByUserId: examiner.id,
        completedByUserId: examiner.id,
        notCompletedByUserId: examiner.id,
        todoByUserId: examiner.id,
        deletedByUserId: examiner.id,
        deletedReasonId: referenceData.id,
      }),
    );
    await TaskDesignation.create(
      fake(TaskDesignation, {
        taskId: task.id,
        designationId: referenceData.id,
      }),
    );
    const taskTemplate = await TaskTemplate.create(
      fake(TaskTemplate, { referenceDataId: referenceData.id }),
    );
    await TaskTemplateDesignation.create(
      fake(TaskTemplateDesignation, {
        taskTemplateId: taskTemplate.id,
        designationId: referenceData.id,
      }),
    );
    await UserDesignation.create(
      fake(UserDesignation, {
        userId: examiner.id,
        designationId: referenceData.id,
      }),
    );

    await Notification.create(
      fake(Notification, {
        userId: examiner.id,
        patientId: patient.id,
      }),
    );
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
    centralSyncManager = new CentralSyncManager(ctx);

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 4);

    await prepareData();
    await centralSyncManager.updateLookupTable();
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    sessionId = fakeUUID();
    const startTime = new Date();
    await models.SyncSession.create({
      id: sessionId,
      startTime,
      lastConnectionTime: startTime,
      debugInfo: {},
    });
    await createSnapshotTable(ctx.store.sequelize, sessionId);
    await models.PatientFacility.truncate({ force: true });
    await models.PatientFacility.create({
      patientId: patient.id,
      facilityId: facility.id,
    });
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 4);
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, -1);
    await models.SyncDeviceTick.truncate({ force: true });
    await models.SyncLookupTick.truncate({ force: true });

    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await dropMarkedForSyncPatientsTable(ctx.store.sequelize, sessionId);
  });

  it('Snapshots patient linked records when it is a full snapshot for marked for sync patients', async () => {
    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      0,
    );

    const since = -1;
    const patientCount = 1;
    const outgoingModels = getModelsForPull(models);
    await snapshotOutgoingChanges(
      ctx.store,
      outgoingModels,
      since,
      patientCount,
      fullSyncPatientsTable,
      sessionId,
      [facility.id],
      null,
      simplestSessionConfig,
      simplestConfig,
    );

    const patientLinkedModels = await getPatientLinkedModels(outgoingModels);
    const syncLookupData = await models.SyncLookup.findAll({});

    for (const model of Object.values(patientLinkedModels)) {
      const syncLookupRecord = syncLookupData.find(
        d => d.dataValues.recordType === model.tableName,
      );

      if (!syncLookupRecord) {
        throw new Error(
          `Cannot find sync lookup record of type '${model.tableName}' when it is a full snapshot for marked for sync patients`,
        );
      }

      const isFacilityIdRequired = ['appointments', 'appointment_schedules'].includes(
        model.tableName,
      );

      expect(syncLookupRecord.dataValues).toEqual(
        expect.objectContaining({
          recordId: expect.anything(),
          recordType: model.tableName,
          patientId: expect.anything(),
          isDeleted: false,
          ...(isFacilityIdRequired ? { facilityId: facility.id } : {}),
        }),
      );
    }

    const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      ctx.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );

    for (const model of Object.values(patientLinkedModels)) {
      const outgoingSnapshotRecord = outgoingSnapshotRecords.find(
        r => r.recordType === model.tableName,
      );

      if (!outgoingSnapshotRecord) {
        throw new Error(
          `Cannot find snapshot record of type '${model.tableName}' when it is a full snapshot for marked for sync patients`,
        );
      }

      expect(outgoingSnapshotRecord).toEqual(
        expect.objectContaining({
          recordId: expect.anything(),
          recordType: model.tableName,
          data: expect.anything(),
          isDeleted: false,
        }),
      );
    }
  });

  it('Does not snapshot non patient linked records when it is a full snapshot for marked for sync patients', async () => {
    const outgoingModels = getModelsForPull(models);

    const fullSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      true,
      [facility.id],
      0,
    );

    const patientLinkedModels = await getPatientLinkedModels(outgoingModels);

    const nonPatientLinkedModels = Object.fromEntries(
      Object.entries(outgoingModels).filter(([, model]) => !model.buildPatientSyncFilter),
    );

    const since = -1;
    const patientCount = 1;
    await snapshotOutgoingChanges(
      ctx.store,
      patientLinkedModels,
      since,
      patientCount,
      fullSyncPatientsTable,
      sessionId,
      [facility.id],
      null,
      simplestSessionConfig,
      simplestConfig,
    );

    const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      ctx.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );

    for (const model of Object.values(nonPatientLinkedModels)) {
      const outgoingSnapshotRecord = outgoingSnapshotRecords.find(
        r => r.recordType === model.tableName,
      );

      if (outgoingSnapshotRecord) {
        throw new Error(
          `Able to snapshot record of type '${model.tableName}' when it is a full snapshot for marked for sync patients`,
        );
      }
    }
  });

  it('Populates updated_at_sync_tick with ticks from actual tables when first build sync_lookup table', async () => {
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, -1); // -1 means first build

    await centralSyncManager.updateLookupTable();

    const patientLookupData = await models.SyncLookup.findOne({
      where: { recordId: patient.id, recordType: 'patients' },
    });

    expect(patientLookupData).toEqual(
      expect.objectContaining({
        recordId: patient.id,
        recordType: 'patients',
        updatedAtSyncTick: patient.updatedAtSyncTick,
      }),
    );
  });

  it('Populates updated_at_sync_tick with the current tick when incrementally update the sync_lookup table', async () => {
    const CURRENT_SYNC_TICK = 7;
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, CURRENT_SYNC_TICK);
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, 1);

    await patient.update({ firstName: 'Test Patient 2' });
    await models.Patient.create(fake(models.Patient));

    const expectedTick = CURRENT_SYNC_TICK + 3; // + 3 because tickTocked twice
    const expectedTock = CURRENT_SYNC_TICK + 4; // + 4 because tickTocked twice
    const originalTickTockImplementation = centralSyncManager.tickTockGlobalClock;

    const spy = jest
      .spyOn(centralSyncManager, 'tickTockGlobalClock')
      .mockImplementationOnce(originalTickTockImplementation)
      .mockImplementationOnce(async () => ({
        tick: expectedTick,
        tock: expectedTock,
      }));

    await centralSyncManager.updateLookupTable();

    const patientLookupData = await models.SyncLookup.findAll({
      where: { recordType: 'patients' },
    });

    expect(patientLookupData.length).toEqual(2);

    patientLookupData.forEach(() => {
      expect.objectContaining({
        recordType: 'patients',
        updatedAtSyncTick: expectedTick.toString(),
      });
    });

    spy.mockRestore();
  });

  describe('Snapshots facility linked records', () => {
    let regularSyncPatientsTable;
    beforeEach(async () => {
      regularSyncPatientsTable = await createMarkedForSyncPatientsTable(
        ctx.store.sequelize,
        sessionId,
        false,
        [facility.id],
        10,
      );
    });
    describe('Settings', () => {
      it('Snapshots settings links with current facility', async () => {
        const facility = await models.Facility.create({
          ...fake(models.Facility),
          name: 'Utopia HQ',
        });
        const setting = await models.Setting.create({
          facilityId: facility.id,
          key: 'test',
          value: { test: 'test' },
          scope: SETTINGS_SCOPES.FACILITY,
        });

        await centralSyncManager.updateLookupTable();

        const settingLookupData = await models.SyncLookup.findOne({
          where: { recordId: setting.id },
        });

        expect(settingLookupData).toEqual(
          expect.objectContaining({
            recordId: setting.id,
            recordType: 'settings',
            patientId: null,
            encounterId: null,
            facilityId: setting.facilityId,
            isLabRequest: false,
            isDeleted: false,
          }),
        );

        const patientCount = 1;
        await snapshotOutgoingChanges(
          ctx.store,
          { Setting: models.Setting },
          SINCE,
          patientCount,
          regularSyncPatientsTable,
          sessionId,
          [facility.id],
          null,
          simplestSessionConfig,
          simplestConfig,
        );

        const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
          ctx.store,
          sessionId,
          SYNC_SESSION_DIRECTION.OUTGOING,
        );

        expect(outgoingSnapshotRecords.find(r => r.recordId === setting.id)).toBeDefined();
      });

      it('Does not snapshot settings linked to a facility other than the current facility', async () => {
        const setting = await models.Setting.create({
          facilityId: facility2.id,
          key: 'test',
          value: { test: 'test' },
          scope: SETTINGS_SCOPES.FACILITY,
        });

        await centralSyncManager.updateLookupTable();

        const settingLookupData = await models.SyncLookup.findOne({
          where: { recordId: setting.id },
        });

        expect(settingLookupData).toEqual(
          expect.objectContaining({
            recordId: setting.id,
            recordType: 'settings',
            patientId: null,
            encounterId: null,
            facilityId: setting.facilityId,
            isLabRequest: false,
            isDeleted: false,
          }),
        );

        const patientCount = 1;
        await snapshotOutgoingChanges(
          ctx.store,
          { Setting: models.Setting },
          SINCE,
          patientCount,
          regularSyncPatientsTable,
          sessionId,
          [facility.id],
          null,
          simplestSessionConfig,
          simplestConfig,
        );

        const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
          ctx.store,
          sessionId,
          SYNC_SESSION_DIRECTION.OUTGOING,
        );

        expect(outgoingSnapshotRecords.find(r => r.recordId === setting.id)).not.toBeDefined();
      });

      it('Snapshots settings with global scope', async () => {
        const setting = await models.Setting.create({
          key: 'test',
          value: { test: 'test' },
          scope: SETTINGS_SCOPES.GLOBAL,
        });

        await centralSyncManager.updateLookupTable();

        const settingLookupData = await models.SyncLookup.findOne({
          where: { recordId: setting.id },
        });

        expect(settingLookupData).toEqual(
          expect.objectContaining({
            recordId: setting.id,
            recordType: 'settings',
            patientId: null,
            encounterId: null,
            facilityId: setting.facilityId,
            isLabRequest: false,
            isDeleted: false,
          }),
        );

        const patientCount = 1;
        await snapshotOutgoingChanges(
          ctx.store,
          { Setting: models.Setting },
          SINCE,
          patientCount,
          regularSyncPatientsTable,
          sessionId,
          [facility.id],
          null,
          simplestSessionConfig,
          simplestConfig,
        );

        const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
          ctx.store,
          sessionId,
          SYNC_SESSION_DIRECTION.OUTGOING,
        );

        expect(outgoingSnapshotRecords.find(r => r.recordId === setting.id)).toBeDefined();
      });
    });
  });

  it('Snapshots patient facility', async () => {
    const patient = await models.Patient.create({
      ...fake(models.Patient),
    });
    const patientFacility = await models.PatientFacility.create({
      facilityId: facility.id,
      patientId: patient.id,
    });

    const regularSyncPatientsTable = await createMarkedForSyncPatientsTable(
      ctx.store.sequelize,
      sessionId,
      false,
      [facility.id],
      10,
    );

    await centralSyncManager.updateLookupTable();

    const patientFacilityLookupData = await models.SyncLookup.findOne({
      where: { recordId: patientFacility.id },
    });

    expect(patientFacilityLookupData).toEqual(
      expect.objectContaining({
        recordId: patientFacility.id,
        recordType: 'patient_facilities',
        patientId: null,
        encounterId: null,
        facilityId: facility.id,
        isLabRequest: false,
        isDeleted: false,
      }),
    );

    const patientCount = 1;
    await snapshotOutgoingChanges(
      ctx.store,
      { Setting: models.Setting },
      SINCE,
      patientCount,
      regularSyncPatientsTable,
      sessionId,
      [facility.id],
      null,
      simplestSessionConfig,
      simplestConfig,
    );

    const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
      ctx.store,
      sessionId,
      SYNC_SESSION_DIRECTION.OUTGOING,
    );

    expect(outgoingSnapshotRecords.find(r => r.recordId === patientFacility.id)).not.toBeDefined();
  });

  describe('syncAllLabRequest', () => {
    let labRequest2;
    let labTestPanel2;
    let labRequestAttachment2;
    let labRequestLog2;
    let labTest2;
    let labTestPanelRequest2;
    let encounter2;

    let labRequestModels;

    let regularSyncPatientsTable;

    beforeAll(async () => {
      // This patient is not marked for sync because there's no patient_facilities created
      // so all attached lab requests should not be synced unless syncAllLabRequest = true
      const patient2 = await models.Patient.create(fake(models.Patient));

      encounter2 = await models.Encounter.create(
        fake(models.Encounter, {
          patientId: patient2.id,
          departmentId: department2.id,
          locationId: location2.id,
          examinerId: examiner.id,
          startDate: '2023-12-21T04:59:51.851Z',
        }),
      );
      const referenceData = await models.ReferenceData.create(fake(models.ReferenceData));

      labRequest2 = await models.LabRequest.create(
        fake(models.LabRequest, {
          departmentId: department2.id,
          collectedById: examiner.id,
          encounterId: encounter2.id,
        }),
      );
      labTestPanel2 = await models.LabTestPanel.create(fake(models.LabTestPanel));
      labTestPanelRequest2 = await models.LabTestPanelRequest.create(
        fake(models.LabTestPanelRequest, {
          encounterId: encounter2.id,
          labTestPanelId: labTestPanel2.id,
        }),
      );
      labRequestLog2 = await models.LabRequestLog.create(
        fake(models.LabRequestLog, {
          status: 'reception_pending',
          labRequestId: labRequest2.id,
        }),
      );
      labRequestAttachment2 = await models.LabRequestAttachment.create(
        fake(models.LabRequestAttachment, {
          labRequestId: labRequest2.id,
        }),
      );
      const labTestType = await models.LabTestType.create(
        fake(models.LabTestType, {
          labTestCategoryId: referenceData.id,
        }),
      );
      labTest2 = await models.LabTest.create(
        fake(models.LabTest, {
          labRequestId: labRequest2.id,
          categoryId: referenceData.id,
          labTestMethodId: referenceData.id,
          labTestTypeId: labTestType.id,
        }),
      );

      labRequestModels = {
        Encounter: models.Encounter,
        LabRequest: models.LabRequest,
        LabRequestAttachment: models.LabRequestAttachment,
        LabRequestLog: models.LabRequestLog,
        LabTest: models.LabTest,
        LabTestPanelRequest: models.LabTestPanelRequest,
      };

      await centralSyncManager.updateLookupTable();

      regularSyncPatientsTable = await createMarkedForSyncPatientsTable(
        ctx.store.sequelize,
        sessionId,
        false,
        [facility.id],
        10,
      );
    });

    it('Snapshots all lab requests records when syncAllLabRequest = true', async () => {
      const sessionConfig = {
        syncAllLabRequests: true,
        isMobile: false,
      };

      const patientCount = 1;
      await snapshotOutgoingChanges(
        ctx.store,
        labRequestModels,
        SINCE,
        patientCount,
        regularSyncPatientsTable,
        sessionId,
        [facility.id],
        null,
        sessionConfig,
        simplestConfig,
      );

      const syncLookupData = await models.SyncLookup.findAll({});

      for (const model of Object.values(labRequestModels)) {
        const syncLookupRecord = syncLookupData.find(
          d => d.dataValues.recordType === model.tableName,
        );

        if (!syncLookupRecord) {
          throw new Error(`Cannot find sync lookup record of type '${model.tableName}'`);
        }

        expect(syncLookupRecord.dataValues).toEqual(
          expect.objectContaining({
            recordId: expect.anything(),
            recordType: model.tableName,
            isLabRequest: true,
            isDeleted: false,
          }),
        );
      }

      const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
        ctx.store,
        sessionId,
        SYNC_SESSION_DIRECTION.OUTGOING,
      );

      const labEncounterIds = outgoingSnapshotRecords
        .filter(r => r.recordType === 'encounters')
        .map(r => r.recordId);
      const labRequestIds = outgoingSnapshotRecords
        .filter(r => r.recordType === 'lab_requests')
        .map(r => r.recordId);
      const labRequestAttachmentIds = outgoingSnapshotRecords
        .filter(r => r.recordType === 'lab_request_attachments')
        .map(r => r.recordId);
      const labRequestLogIds = outgoingSnapshotRecords
        .filter(r => r.recordType === 'lab_request_logs')
        .map(r => r.recordId);
      const labTestIds = outgoingSnapshotRecords
        .filter(r => r.recordType === 'lab_tests')
        .map(r => r.recordId);
      const labTestPanelRequests = outgoingSnapshotRecords
        .filter(r => r.recordType === 'lab_test_panel_requests')
        .map(r => r.recordId);

      expect(labEncounterIds.sort()).toEqual([encounter1.id, encounter2.id].sort());
      expect(labRequestIds.sort()).toEqual([labRequest1.id, labRequest2.id].sort());
      expect(labRequestAttachmentIds.sort()).toEqual(
        [labRequestAttachment1.id, labRequestAttachment2.id].sort(),
      );
      expect(labRequestLogIds.sort()).toEqual([labRequestLog1.id, labRequestLog2.id].sort());
      expect(labTestIds.sort()).toEqual([labTest1.id, labTest2.id].sort());
      expect(labTestPanelRequests.sort()).toEqual(
        [labTestPanelRequest1.id, labTestPanelRequest2.id].sort(),
      );
    });

    it('Snapshots only lab requests records linked to marked for sync patients when syncAllLabRequest = false', async () => {
      const labRequestModels = {
        Encounter: models.Encounter,
        LabRequest: models.LabRequest,
        LabRequestAttachment: models.LabRequestAttachment,
        LabRequestLog: models.LabRequestLog,
        LabTest: models.LabTest,
        LabTestPanelRequest: models.LabTestPanelRequest,
      };

      const sessionConfig = {
        syncAllLabRequests: false,
        isMobile: false,
      };

      const patientCount = 1;
      await snapshotOutgoingChanges(
        ctx.store,
        labRequestModels,
        SINCE,
        patientCount,
        regularSyncPatientsTable,
        sessionId,
        [facility.id],
        null,
        sessionConfig,
        simplestConfig,
      );

      const syncLookupData = await models.SyncLookup.findAll({});
      for (const model of Object.values(labRequestModels)) {
        const syncLookupRecord = syncLookupData.find(
          d => d.dataValues.recordType === model.tableName,
        );

        if (!syncLookupRecord) {
          throw new Error(`Cannot find sync lookup record of type '${model.tableName}'`);
        }

        expect(syncLookupRecord.dataValues).toEqual(
          expect.objectContaining({
            recordId: expect.anything(),
            recordType: model.tableName,
            isLabRequest: true,
            isDeleted: false,
          }),
        );
      }

      const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
        ctx.store,
        sessionId,
        SYNC_SESSION_DIRECTION.OUTGOING,
      );

      const labEncounterIds = outgoingSnapshotRecords
        .filter(r => r.recordType === 'encounters')
        .map(r => r.recordId);
      const labRequestIds = outgoingSnapshotRecords
        .filter(r => r.recordType === 'lab_requests')
        .map(r => r.recordId);
      const labRequestAttachmentIds = outgoingSnapshotRecords
        .filter(r => r.recordType === 'lab_request_attachments')
        .map(r => r.recordId);
      const labRequestLogIds = outgoingSnapshotRecords
        .filter(r => r.recordType === 'lab_request_logs')
        .map(r => r.recordId);
      const labTestIds = outgoingSnapshotRecords
        .filter(r => r.recordType === 'lab_tests')
        .map(r => r.recordId);
      const labTestPanelRequests = outgoingSnapshotRecords
        .filter(r => r.recordType === 'lab_test_panel_requests')
        .map(r => r.recordId);

      expect(labEncounterIds).toEqual([encounter1.id]);
      expect(labRequestIds).toEqual([labRequest1.id]);
      expect(labRequestAttachmentIds).toEqual([labRequestAttachment1.id]);
      expect(labRequestLogIds).toEqual([labRequestLog1.id]);
      expect(labTestIds).toEqual([labTest1.id]);
      expect(labTestPanelRequests).toEqual([labTestPanelRequest1.id]);
    });

    it("Updates existing encounter's isLabRequest to be TRUE when encounter got lab request attached to it ", async () => {
      const patient3 = await models.Patient.create(fake(models.Patient));

      const encounter3 = await models.Encounter.create(
        fake(models.Encounter, {
          patientId: patient3.id,
          departmentId: department.id,
          locationId: location.id,
          examinerId: examiner.id,
          startDate: '2023-12-21T04:59:51.851Z',
        }),
      );

      await centralSyncManager.updateLookupTable();

      const nonLabRequestEncounterLookupData = await models.SyncLookup.findOne({
        where: { recordId: encounter3.id },
      });

      expect(nonLabRequestEncounterLookupData.isLabRequest).toBeFalse();

      const labRequest = await models.LabRequest.create(
        fake(models.LabRequest, {
          departmentId: department.id,
          collectedById: examiner.id,
          encounterId: encounter3.id,
        }),
      );

      await centralSyncManager.updateLookupTable();

      const labRequestLookupData = await models.SyncLookup.findOne({
        where: { recordId: labRequest.id },
      });
      const labRequestEncounterLookupData = await models.SyncLookup.findOne({
        where: { recordId: encounter3.id },
      });

      expect(labRequestLookupData).toBeDefined();
      expect(labRequestEncounterLookupData.isLabRequest).toBeTrue();
    });
  });

  describe('avoidRepull', () => {
    const snapshotOutgoingRecordsForFacility = async avoidRepull => {
      const deviceId = 'facility-a';
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 4);
      const pushedPatientFromCurrentFacility = await models.Patient.create(fake(models.Patient));

      // Set new sync time so that it does not match the SyncDeviceTick record
      // in order to have it included in the snapshot.
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 5);
      const patientFromAnotherFacility = await models.Patient.create(fake(models.Patient));

      await models.SyncDeviceTick.create({
        deviceId,
        persistedAtSyncTick: pushedPatientFromCurrentFacility.updatedAtSyncTick,
      });

      const actualConfig = jest.requireActual('config');
      const { CentralSyncManager } = require('../../dist/sync/CentralSyncManager');
      const config = {
        ...actualConfig,
        sync: {
          ...actualConfig.sync,
          lookupTable: {
            enabled: true,
            perModelUpdateTimeoutMs: 40000,
            avoidRepull,
          },
        },
      };
      CentralSyncManager.overrideConfig(config);

      const centralSyncManager = new CentralSyncManager(ctx);
      await centralSyncManager.updateLookupTable();

      const regularSyncPatientsTable = await createMarkedForSyncPatientsTable(
        ctx.store.sequelize,
        sessionId,
        false,
        facility.id,
        10,
      );

      const sessionConfig = {
        syncAllLabRequests: true,
        isMobile: false,
      };

      const patientCount = 1;
      await snapshotOutgoingChanges(
        ctx.store,
        { Patient: models.Patient },
        SINCE,
        patientCount,
        regularSyncPatientsTable,
        sessionId,
        facility.id,
        deviceId,
        sessionConfig,
        config,
      );

      const outgoingSnapshotRecords = await findSyncSnapshotRecordsOrderByDependency(
        ctx.store,
        sessionId,
        SYNC_SESSION_DIRECTION.OUTGOING,
      );

      return {
        outgoingSnapshotRecords,
        pushedPatientFromCurrentFacility,
        patientFromAnotherFacility,
      };
    };
    it("Avoids repull data for a device when 'avoidRepull' feature flag is enabled", async () => {
      const {
        outgoingSnapshotRecords,
        pushedPatientFromCurrentFacility,
        patientFromAnotherFacility,
      } = await snapshotOutgoingRecordsForFacility(true);
      const snapshotPushedPatientFromCurrentFacility = outgoingSnapshotRecords.find(
        r => r.recordId === pushedPatientFromCurrentFacility.id,
      );
      const snapshotPatientFromAnotherFacility = outgoingSnapshotRecords.find(
        r => r.recordId === patientFromAnotherFacility.id,
      );

      expect(snapshotPushedPatientFromCurrentFacility).not.toBeDefined();
      expect(snapshotPatientFromAnotherFacility).toBeDefined();
    });

    it("Repulls data for a device when 'avoidRepull' feature flag is disabled", async () => {
      const {
        outgoingSnapshotRecords,
        pushedPatientFromCurrentFacility,
        patientFromAnotherFacility,
      } = await snapshotOutgoingRecordsForFacility(false);
      const snapshotPushedPatientFromCurrentFacility = outgoingSnapshotRecords.find(
        r => r.recordId === pushedPatientFromCurrentFacility.id,
      );
      const snapshotPatientFromAnotherFacility = outgoingSnapshotRecords.find(
        r => r.recordId === patientFromAnotherFacility.id,
      );

      expect(snapshotPushedPatientFromCurrentFacility).toBeDefined();
      expect(snapshotPatientFromAnotherFacility).toBeDefined();
    });
  });

  describe('updates child records when parent records are updated in sync_lookup', () => {
    const setupAutocompleteSurvey = async (sscConfig, answerBody) => {
      const {
        Facility,
        Location,
        Department,
        Patient,
        User,
        Encounter,
        Program,
        Survey,
        SurveyResponse,
        ProgramDataElement,
        SurveyScreenComponent,
        SurveyResponseAnswer,
      } = models;

      const facility = await Facility.create(fake(Facility));
      const location = await Location.create({
        ...fake(Location),
        facilityId: facility.id,
      });
      const department = await Department.create({
        ...fake(Department),
        facilityId: facility.id,
      });
      const examiner = await User.create(fake(User));
      const patient = await Patient.create(fake(Patient));
      const encounter = await Encounter.create({
        ...fake(Encounter),
        patientId: patient.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: examiner.id,
      });
      const program = await Program.create(fake(Program));
      const survey = await Survey.create({
        ...fake(Survey),
        programId: program.id,
      });
      const response = await SurveyResponse.create({
        ...fake(SurveyResponse),
        surveyId: survey.id,
        encounterId: encounter.id,
      });
      const dataElement = await ProgramDataElement.create({
        ...fake(ProgramDataElement),
        type: 'Autocomplete',
      });
      await SurveyScreenComponent.create({
        ...fake(SurveyScreenComponent),
        responseId: response.id,
        dataElementId: dataElement.id,
        surveyId: survey.id,
        config: sscConfig,
      });
      const answer = await SurveyResponseAnswer.create({
        ...fake(SurveyResponseAnswer),
        dataElementId: dataElement.id,
        responseId: response.id,
        body: answerBody,
      });

      return { patient, encounter, answer, response };
    };

    it('updates patient_id of child records when patient_id of parent records are updated in sync_lookup', async () => {
      const { patient, encounter, answer, response } = await setupAutocompleteSurvey(
        JSON.stringify({
          source: 'Facility',
        }),
        facility.id,
      );

      await centralSyncManager.updateLookupTable();

      const encounterLookupData = await models.SyncLookup.findOne({
        where: { recordId: encounter.id },
      });
      const responseLookupData = await models.SyncLookup.findOne({
        where: { recordId: response.id },
      });
      const answerLookupData = await models.SyncLookup.findOne({
        where: { recordId: answer.id },
      });

      expect(encounterLookupData.patientId).toBe(patient.id);
      expect(responseLookupData.patientId).toBe(patient.id);
      expect(answerLookupData.patientId).toBe(patient.id);

      const patient2 = await models.Patient.create(fake(models.Patient));

      // eslint-disable-next-line require-atomic-updates
      encounter.patientId = patient2.id;

      const newTick = 10;
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, newTick);

      await encounter.save();

      // Expect the db listener (registered in registerSyncLookupUpdateListener.js)
      // to also update the dependent records of encounter
      await waitForExpect(async () => {
        await encounter.reload();
        await response.reload();
        await answer.reload();

        // sequelize returns bigint as string
        expect(parseInt(encounter.updatedAtSyncTick, 10)).toBe(newTick);
        expect(parseInt(response.updatedAtSyncTick, 10)).toBe(newTick);
        expect(parseInt(answer.updatedAtSyncTick, 10)).toBe(newTick);
      });

      await centralSyncManager.updateLookupTable();

      const encounterLookupData2 = await models.SyncLookup.findOne({
        where: { recordId: encounter.id },
      });
      const responseLookupData2 = await models.SyncLookup.findOne({
        where: { recordId: response.id },
      });
      const answerLookupData2 = await models.SyncLookup.findOne({
        where: { recordId: answer.id },
      });

      expect(encounterLookupData2.patientId).toBe(patient2.id);
      expect(responseLookupData2.patientId).toBe(patient2.id);
      expect(answerLookupData2.patientId).toBe(patient2.id);
    });
  });
});
