import {
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { fake } from '../../fake/index.js';

import type {
  Department,
  Facility,
  InvoiceProduct,
  LabTestType,
  Location,
  LocationGroup,
  Models,
  ProgramRegistry,
  ReferenceData,
  ScheduledVaccine,
  Survey,
  User,
} from '@tamanu/database';

export const generateImportData = async ({
  ReferenceData,
  ReferenceDataRelation,
  Facility,
  LocationGroup,
  Location,
  Department,
  Survey,
  SurveyScreenComponent,
  ScheduledVaccine,
  ProgramDataElement,
  Program,
  ProgramRegistry,
  ProgramRegistryCondition,
  ProgramRegistryClinicalStatus,
  InvoiceProduct,
  LabTestType,
  User,
}: Models): Promise<{
  referenceData: ReferenceData;
  facility: Facility;
  department: Department;
  locationGroup: LocationGroup;
  location: Location;
  survey: Survey;
  scheduledVaccine: ScheduledVaccine;
  invoiceProduct: InvoiceProduct;
  labTestType: LabTestType;
  user: User;
  programRegistry: ProgramRegistry;
}> => {
  const referenceData = await ReferenceData.create(
    fake(ReferenceData, {
      type: REFERENCE_TYPES.DRUG,
    }),
  );
  await ReferenceDataRelation.create(fake(ReferenceDataRelation));

  const facility = await Facility.create(fake(Facility));
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
  const department = await Department.create(
    fake(Department, {
      facilityId: facility.id,
    }),
  );

  const survey = await Survey.create(fake(Survey));
  await SurveyScreenComponent.create(
    fake(SurveyScreenComponent, {
      surveyId: survey.id,
      option: '{"foo":"bar"}',
      config: '{"source": "ReferenceData", "where": {"type": "facility"}}',
    }),
  );

  const scheduledVaccine = await ScheduledVaccine.create(
    fake(ScheduledVaccine, {
      vaccineId: referenceData.id,
    }),
  );

  await ProgramDataElement.create(fake(ProgramDataElement));
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

  const invoiceProduct = await InvoiceProduct.create(
    fake(InvoiceProduct, {
      category: INVOICE_ITEMS_CATEGORIES.DRUG,
      sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.DRUG],
      sourceRecordId: referenceData.id,
    }),
  );

  const labTestType = await LabTestType.create(
    fake(LabTestType, {
      labTestCategoryId: referenceData.id,
    }),
  );

  const user = await User.create(fake(User));

  return {
    referenceData,
    facility,
    department,
    locationGroup,
    location,
    survey,
    scheduledVaccine,
    invoiceProduct,
    labTestType,
    user,
    programRegistry,
  };
};
