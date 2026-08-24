import {
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '@tamanu/constants/programRegistry';
import { fake, chance } from '../../fake/index.js';

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

// Realistic names for the reference data the seed generator creates, so seed
// snapshots surface real-looking clinical data rather than fakeString placeholders
// (e.g. "ReferenceData.name.<uuid>") in medication, allergy, and program registry lists.
const DRUG_NAMES = ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Metformin', 'Salbutamol'];

const ALLERGY_NAMES = [
  'Penicillins', 'Peanuts', 'NSAIDs', 'Sulfonamides', 'Shellfish',
  'Latex', 'Aspirin', 'Eggs', 'Tree nuts', 'Soy',
  'Cephalosporins', 'Iodine contrast', 'Bee stings', 'Dairy', 'Codeine',
];

const PROGRAM_REGISTRY_NAMES = [
  'Hypertension', 'Diabetes', 'Tuberculosis', 'HIV', 'Antenatal care',
  'Non-communicable disease', 'COVID-19', 'Cervical cancer screening',
  'Mental health', 'Nutrition', 'Immunisation', 'Malaria',
];

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
      name: chance.pickone(DRUG_NAMES),
    }),
  );
  await ReferenceDataRelation.create(fake(ReferenceDataRelation));

  // Seed a small, stable pool of allergy reference data that patient allergies
  // can point at, rather than each patient allergy minting its own ReferenceData
  // (which bloated the table and slowed every random reference-data lookup).
  // findOrCreate by code keeps it to one row per name across the whole run.
  for (let i = 0; i < ALLERGY_NAMES.length; i++) {
    await ReferenceData.findOrCreate({
      where: { type: REFERENCE_TYPES.ALLERGY, code: `allergy-${i}` },
      defaults: fake(ReferenceData, {
        type: REFERENCE_TYPES.ALLERGY,
        code: `allergy-${i}`,
        name: ALLERGY_NAMES[i],
      }),
    });
  }

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
      name: `${chance.pickone(PROGRAM_REGISTRY_NAMES)} program registry`,
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
  // Create the 'unknown' condition category up front so createProgramRegistry can
  // just look it up, instead of many concurrent calls racing to findOrCreate it.
  await ProgramRegistryConditionCategory.create(
    fake(ProgramRegistryConditionCategory, {
      code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
      name: PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN],
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
