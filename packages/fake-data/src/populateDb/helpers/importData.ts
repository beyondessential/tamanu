import {
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '@tamanu/constants/programRegistry';
import { fake } from '../../fake/index.js';
import { REFERENCE_DATA_NAMES } from '../../fake/names.js';
import { pooled, pooledWithChild } from '../pool.js';
import { createReferenceData } from './referenceData.js';

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
  ReferenceDrug,
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
  // A relation must point at real reference data on both ends. fake() nulls FK columns, so a
  // bare fake(ReferenceDataRelation) leaves referenceDataId null: central allows it (nullable
  // column) but it breaks the mobile NOT NULL constraint on sync (reference_data_relations
  // insert fails). Give it a valid parent and child.
  const createDrug = () =>
    createReferenceData({ ReferenceData, ReferenceDrug }, REFERENCE_TYPES.DRUG);
  const drugRelation = async (childId: string) => {
    const parent = await createDrug();
    return ReferenceDataRelation.create(
      fake(ReferenceDataRelation, {
        referenceDataParentId: parent.id,
        referenceDataId: childId,
      }),
    );
  };
  const referenceData = await pooledWithChild(
    ReferenceData,
    createDrug,
    ReferenceDataRelation,
    drugRelation,
    { where: { type: REFERENCE_TYPES.DRUG } },
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

  const facility = await pooled(Facility, () => Facility.create(fake(Facility)), { size: 100 });
  // A round's department, location and location group all have to sit at its facility.
  const locationGroup = await pooled(
    LocationGroup,
    () => LocationGroup.create(fake(LocationGroup, { facilityId: facility.id })),
    { where: { facilityId: facility.id } },
  );
  const location = await pooled(
    Location,
    () =>
      Location.create(
        fake(Location, { facilityId: facility.id, locationGroupId: locationGroup.id }),
      ),
    { where: { facilityId: facility.id, locationGroupId: locationGroup.id } },
  );
  const department = await pooled(
    Department,
    () => Department.create(fake(Department, { facilityId: facility.id })),
    { where: { facilityId: facility.id } },
  );

  const screenComponent = async (surveyId: string) => {
    const dataElement = await ProgramDataElement.create(fake(ProgramDataElement));
    return SurveyScreenComponent.create(
      fake(SurveyScreenComponent, {
        surveyId,
        dataElementId: dataElement.id,
        option: '{"foo":"bar"}',
        config: '{"source": "ReferenceData", "where": {"type": "facility"}}',
      }),
    );
  };
  const survey = await pooledWithChild(
    Survey,
    () => Survey.create(fake(Survey)),
    SurveyScreenComponent,
    screenComponent,
  );

  const scheduledVaccine = await pooled(ScheduledVaccine, () =>
    ScheduledVaccine.create(fake(ScheduledVaccine, { vaccineId: referenceData.id })),
  );

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

  // The Program Registry sidebar lists every registry, so this pool stays far smaller
  // than the rest.
  const programRegistry = await pooled(ProgramRegistry, seedProgramRegistry, { size: 8 });

  const invoiceProduct = await pooled(InvoiceProduct, () =>
    InvoiceProduct.create(
      fake(InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.DRUG,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.DRUG],
        sourceRecordId: referenceData.id,
      }),
    ),
  );

  const labTestType = await pooled(LabTestType, () =>
    LabTestType.create(fake(LabTestType, { labTestCategoryId: referenceData.id })),
  );

  const user = await pooled(User, () => User.create(fake(User)));

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
