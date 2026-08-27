import {
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '@tamanu/constants/programRegistry';
import { chance, fake } from '../../fake/index.js';
import { REFERENCE_DATA_NAMES } from '../../fake/names.js';

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
  ProgramRegistryConditionCategory,
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
  // A relation must point at real reference data on both ends. fake() nulls FK columns, so a
  // bare fake(ReferenceDataRelation) leaves referenceDataId null — central allows it (nullable
  // column) but it breaks the mobile NOT NULL constraint on sync (reference_data_relations
  // insert fails). Give it a valid parent and child.
  const parentReferenceData = await ReferenceData.create(
    fake(ReferenceData, { type: REFERENCE_TYPES.DRUG }),
  );
  await ReferenceDataRelation.create(
    fake(ReferenceDataRelation, {
      referenceDataParentId: parentReferenceData.id,
      referenceDataId: referenceData.id,
    }),
  );

  // A small, stable pool of allergy reference data for patient allergies to point at,
  // rather than each patient allergy minting its own ReferenceData: that bloats the table
  // and slows every random reference-data lookup. findOrCreate keeps it to one row per name.
  for (const name of REFERENCE_DATA_NAMES[REFERENCE_TYPES.ALLERGY]) {
    await ReferenceData.findOrCreate({
      where: { type: REFERENCE_TYPES.ALLERGY, name },
      defaults: fake(ReferenceData, { type: REFERENCE_TYPES.ALLERGY, name }),
    });
  }

  // A deployment has at most a few hundred facilities, not one per data round, so once
  // the pool is full each round reuses one instead of minting another.
  const FACILITY_POOL_SIZE = 100;
  const facilityIds = (await Facility.findAll({ attributes: ['id'], raw: true })).map(
    (row: { id: string }) => row.id,
  );
  const facility =
    facilityIds.length >= FACILITY_POOL_SIZE
      ? (await Facility.findByPk(chance.pickone(facilityIds)))!
      : await Facility.create(fake(Facility));
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

  const seedProgramRegistry = async () => {
    const program = await Program.create(fake(Program));
    const registry = await ProgramRegistry.create(
      fake(ProgramRegistry, {
        programId: program.id,
      }),
    );
    await ProgramRegistryCondition.create(
      fake(ProgramRegistryCondition, {
        programRegistryId: registry.id,
      }),
    );
    await ProgramRegistryClinicalStatus.create(
      fake(ProgramRegistryClinicalStatus, {
        programRegistryId: registry.id,
      }),
    );
    // Create the 'unknown' condition category up front so createProgramRegistry (the
    // tally helper) can just look it up, instead of many concurrent calls racing to
    // findOrCreate it.
    await ProgramRegistryConditionCategory.create(
      fake(ProgramRegistryConditionCategory, {
        code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
        name: PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[
          PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN
        ],
        programRegistryId: registry.id,
      }),
    );
    return registry;
  };

  // A deployment has a small, fixed set of program registries, not one per data round.
  // Without a cap every round minted another and the Program Registry sidebar filled with
  // dozens of entries; once the pool is full, reuse an existing one instead.
  const PROGRAM_REGISTRY_POOL_SIZE = 8;
  const programRegistryIds = (
    await ProgramRegistry.findAll({ attributes: ['id'], raw: true })
  ).map((row: { id: string }) => row.id);
  const programRegistry =
    programRegistryIds.length >= PROGRAM_REGISTRY_POOL_SIZE
      ? (await ProgramRegistry.findByPk(chance.pickone(programRegistryIds)))!
      : await seedProgramRegistry();

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
