import { fake } from '@tamanu/shared/test-helpers/fake';
import {
  SYNC_DIRECTIONS,
  PATIENT_FIELD_DEFINITION_TYPES,
  NOTE_RECORD_TYPES,
  REPORT_DB_SCHEMAS,
  REPORT_STATUSES,
} from '@tamanu/constants';
import { sortInDependencyOrder } from '@tamanu/shared/models/sortInDependencyOrder';
import { getModelsForDirection } from '@tamanu/shared/sync';

import { CentralSyncManager } from '../../dist/sync/CentralSyncManager';
import { createTestContext } from '../utilities';
import { getPatientLinkedModels } from '../../dist/sync/getPatientLinkedModels';

describe('Sync Lookup data', () => {
  let ctx;
  let models;
  let centralSyncManager;

  const prepareData = async () => {
    const {
      Asset,
      PatientFieldDefinitionCategory,
      Program,
      ProgramDataElement,
      ProgramRegistry,
      ProgramRegistryClinicalStatus,
      ProgramRegistryCondition,
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
      PatientFacility,
      PatientFamilyHistory,
      PatientFieldDefinition,
      PatientFieldValue,
      PatientIssue,
      PatientProgramRegistration,
      PatientProgramRegistrationCondition,
      PatientSecondaryId,
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
      Encounter,
      EncounterDiagnosis,
      EncounterDiet,
      EncounterHistory,
      EncounterMedication,
      ImagingRequest,
      ImagingRequestArea,
      ImagingResult,
      Invoice,
      InvoiceDiscount,
      InvoiceInsurer,
      InvoiceItem,
      InvoiceItemDiscount,
      InvoicePayment,
      LabTestPanelRequest,
      Procedure,
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
    await CertifiableVaccine.create(
      fake(CertifiableVaccine, { vaccineId: referenceData.id }),
    );
    await ImagingAreaExternalCode.create(
      fake(ImagingAreaExternalCode, { areaId: referenceData.id }),
    );

    await Setting.create(fake(Setting));
    await Template.create(fake(Template));

    const examiner = await User.create(fake(User));
    const patient = await Patient.create(fake(Patient));
    const facility = await Facility.create(fake(Facility));
    const department = await Department.create(
      fake(Department, {
        facilityId: facility.id,
      }),
    );
    const locationGroup = await LocationGroup.create(
      fake(LocationGroup, {
        facilityId: facility.id,
      }),
    );
    const location = await Location.create(
      fake(Location, {
        facilityId: facility.id,
        locationGroupId: locationGroup.id,
      }),
    );

    await PatientFacility.create({
      patientId: patient.id,
      facilityId: facility.id,
    });
    await UserFacility.create({
      userId: examiner.id,
      facilityId: facility.id,
    });
    await PatientFamilyHistory.create(
      fake(PatientFamilyHistory, { patientId: patient.id }),
    );
    await PatientCondition.create(
      fake(PatientCondition, { patientId: patient.id }),
    );
    await PatientCarePlan.create(
      fake(PatientCarePlan, { patientId: patient.id }),
    );
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
    await Appointment.create(fake(Appointment, { patientId: patient.id }));
    const encounter = await Encounter.create(
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
        encounterId: encounter.id,
        dischargerId: examiner.id,
      }),
    );
    await EncounterHistory.create(
      fake(EncounterHistory, {
        examinerId: examiner.id,
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
      }),
    );
    await EncounterDiet.create(
      fake(EncounterDiet, {
        encounterId: encounter.id,
        dietId: referenceData.id,
      }),
    );
    await EncounterMedication.create(
      fake(EncounterMedication, {
        encounterId: encounter.id,
        medicationId: referenceData.id,
      }),
    );
    const imagingRequest = await ImagingRequest.create(
      fake(ImagingRequest, {
        encounterId: encounter.id,
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
        recordId: encounter.id,
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
    const surveyResponse = await SurveyResponse.create(
      fake(SurveyResponse, {
        surveyId: survey.id,
        encounterId: encounter.id,
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
    const labRequest = await LabRequest.create(
      fake(LabRequest, {
        departmentId: department.id,
        collectedById: examiner.id,
        encounterId: encounter.id,
      }),
    );
    const labTestPanel = await models.LabTestPanel.create(fake(LabTestPanel));
    await LabTestPanelRequest.create(
      fake(LabTestPanelRequest, {
        encounterId: encounter.id,
        labTestPanelId: labTestPanel.id,
      }),
    );
    await LabRequestLog.create(
      fake(LabRequestLog, {
        status: 'reception_pending',
        labRequestId: labRequest.id,
      }),
    );
    const labTestType = await LabTestType.create(
      fake(LabTestType, {
        labTestCategoryId: referenceData.id,
      }),
    );
    await LabTest.create(
      fake(LabTest, {
        labRequestId: labRequest.id,
        categoryId: referenceData.id,
        labTestMethodId: referenceData.id,
        labTestTypeId: labTestType.id,
      }),
    );
    await LabTestPanelLabTestTypes.create({
      labTestPanelId: labTestPanel.id,
      labTestTypeId: labTestType.id,
    });
    await Procedure.create(
      fake(Procedure, {
        encounterId: encounter.id,
      }),
    );
    // work around as Triage.create needs config.serverFacilityId which is not available in central
    await Triage.upsert({
      encounterId: encounter.id,
      patientId: patient.id,
      departmentId: department.id,
      facilityId: facility.id,
    });
    await Vitals.create(
      fake(Vitals, {
        encounterId: encounter.id,
      }),
    );
    await LabRequestAttachment.create(
      fake(LabRequestAttachment, {
        labRequestId: labRequest.id,
      }),
    );
    await models.DocumentMetadata.create(
      fake(DocumentMetadata, {
        encounterId: encounter.id,
      }),
    );
    await models.Referral.create(
      fake(Referral, {
        initiatingEncounterId: encounter.id,
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
    await ProgramRegistryCondition.create(
      fake(ProgramRegistryCondition, {
        programRegistryId: programRegistry.id,
      }),
    );
    await ProgramRegistryClinicalStatus.create(
      fake(ProgramRegistryClinicalStatus, {
        programRegistryId: programRegistry.id,
      }),
    );
    await PatientProgramRegistration.create(
      fake(PatientProgramRegistration, {
        clinicianId: examiner.id,
        patientId: patient.id,
        programRegistryId: programRegistry.id,
      }),
    );
    await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientId: patient.id,
        programRegistryId: programRegistry.id,
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
        encounterId: encounter.id,
      }),
    );

    await EncounterDiagnosis.create(
      fake(EncounterDiagnosis, {
        diagnosisId: referenceData.id,
        encounterId: encounter.id,
      }),
    );
    const invoice = await Invoice.create(
      fake(Invoice, {
        encounterId: encounter.id,
      }),
    );
    await InvoiceDiscount.create(
      fake(InvoiceDiscount, {
        invoiceId: invoice.id,
        appliedByUserId: examiner.id,
      }),
    );
    await InvoiceInsurer.create(
      fake(InvoiceInsurer, {
        invoiceId: invoice.id,
        insurerId: referenceData.id,
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
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
    centralSyncManager = new CentralSyncManager(ctx);

    await prepareData();
    await centralSyncManager.updateLookupTable();
  });

  it('Records of patient linked tables should have patient_id value', async () => {
    const outgoingModels = getModelsForDirection(models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);

    const patientLinkedModels = await getPatientLinkedModels(outgoingModels);
    const sortedLinkedModels = sortInDependencyOrder(patientLinkedModels);

    const syncLookupData = await models.SyncLookup.findAll({});

    for (const model of Object.values(sortedLinkedModels)) {
      const syncLookupRecord = syncLookupData.find(
        d => d.dataValues.recordType === model.tableName,
      );

      if (!syncLookupRecord) {
        throw new Error(`Cannot find sync lookup record with ${model.tableName}`);
      }

      expect(syncLookupRecord.dataValues).toEqual(
        expect.objectContaining({
          recordId: expect.anything(),
          recordType: model.tableName,
          patientId: expect.anything(),
          facilityId: null, // patient linked models should not spit out facilityId
          isDeleted: false,
        }),
      );
    }
  });

  it('Records of lab requests related tables should have isLabRequest = true', async () => {
    const labRequestModels = [
      models.Encounter,
      models.LabRequest,
      models.LabRequestAttachment,
      models.LabRequestLog,
      models.LabTest,
      models.LabTestPanelRequest,
    ];

    const syncLookupData = await models.SyncLookup.findAll({});
    for (const model of labRequestModels) {
      const syncLookupRecord = syncLookupData.find(
        d => d.dataValues.recordType === model.tableName,
      );

      if (!syncLookupRecord) {
        throw new Error(`Cannot find sync lookup record with ${model.tableName}`);
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
  });

  it('Records of tables that are not linked to patients should not have patient_id value', async () => {
    const outgoingModels = getModelsForDirection(models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);

    const nonPatientLinkedModels = Object.fromEntries(
      Object.entries(outgoingModels).filter(([, model]) => !model.buildPatientSyncFilter),
    );

    const sortedLinkedModels = sortInDependencyOrder(nonPatientLinkedModels);

    const syncLookupData = await models.SyncLookup.findAll({});

    for (const model of Object.values(sortedLinkedModels)) {
      const syncLookupRecord = syncLookupData.find(
        d => d.dataValues.recordType === model.tableName,
      );

      if (!syncLookupRecord) {
        throw new Error(`Cannot find sync lookup record with ${model.tableName}`);
      }

      expect(syncLookupRecord.dataValues).toEqual(
        expect.objectContaining({
          recordId: expect.anything(),
          recordType: model.tableName,
          patientId: null,
          isDeleted: false,
        }),
      );
    }
  });
});
