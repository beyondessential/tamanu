import { OTHER_REFERENCE_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import {
  administeredVaccineLoader,
  labTestPanelLoader,
  patientDataLoader,
  patientFieldDefinitionLoader,
  permissionLoader,
  taskTemplateLoader,
  taskSetLoader,
  translatedStringLoader,
  userLoader,
  drugLoader,
  medicationTemplateLoader,
  medicationSetLoader,
  procedureTypeLoader,
  invoiceProductLoader,
} from './loaders';
import { invoicePriceListItemLoaderFactory } from './invoicePriceListItemLoaderFactory';
import { invoiceInsurancePlanItemLoaderFactory } from './invoiceInsurancePlanItemLoaderFactory';

// All reference data is imported first, so that can be assumed for ordering.
//
// sheetNameNormalised: {
//   model: 'ModelName' (defaults to `upperFirst(sheetNameNormalised)`),
//   loader: fn(item) => Array<LoadRow> (defaults to `loaderFactory(Model)`),
//   needs: ['otherSheetNames', 'thisOneNeeds'] (defaults to `[]`),
// }
//
// where interface LoadRow { model: string; values: object; }
//
// creating dependency cycles will (intentionally) crash the importer
export default {
  user: {
    loader: userLoader,
    needs: ['facility'],
  },

  patient: {
    loader: patientDataLoader,
    needs: ['user', 'patientFieldDefinition'],
  },

  facility: {},
  department: {
    needs: ['facility'],
  },
  locationGroup: {
    needs: ['facility'],
  },
  location: {
    needs: ['facility', 'locationGroup'],
  },

  userFacility: {
    needs: ['facility', 'user'],
  },

  certifiableVaccine: {},
  scheduledVaccine: {},
  administeredVaccine: {
    loader: administeredVaccineLoader,
    needs: ['scheduledVaccine', 'user', 'location', 'department'],
  },

  labTestType: {},
  labTestPanel: {
    loader: labTestPanelLoader,
    needs: ['labTestType'],
  },
  invoiceProduct: {
    loader: invoiceProductLoader,
    needs: [OTHER_REFERENCE_TYPES.LAB_TEST_TYPE, OTHER_REFERENCE_TYPES.LAB_TEST_PANEL],
  },

  invoicePriceList: {},
  invoicePriceListItem: {
    get loader() {
      // Use a getter to create a fresh loader instance on each access
      return invoicePriceListItemLoaderFactory();
    },
    needs: ['invoicePriceList', 'invoiceProduct'],
  },

  // Insurance plans and items (mirror price lists & items)
  invoiceInsurancePlan: {},
  invoiceInsurancePlanItem: {
    get loader() {
      // Create a fresh loader instance on each access
      return invoiceInsurancePlanItemLoaderFactory();
    },
    needs: ['invoiceInsurancePlan', 'invoiceProduct'],
  },

  role: {},
  permission: {
    loader: permissionLoader,
    needs: ['role'],
  },

  patientFieldDefinitionCategory: {},
  patientFieldDefinition: {
    loader: patientFieldDefinitionLoader,
    needs: ['patientFieldDefinitionCategory'],
  },

  imagingAreaExternalCode: {},
  imagingTypeExternalCode: {},

  translatedString: {
    loader: translatedStringLoader,
  },

  referenceDataRelation: {},

  [REFERENCE_TYPES.TASK_TEMPLATE]: {
    loader: taskTemplateLoader,
  },

  [REFERENCE_TYPES.TASK_SET]: {
    loader: taskSetLoader,
  },

  [REFERENCE_TYPES.DRUG]: {
    loader: drugLoader,
  },
  [REFERENCE_TYPES.MEDICATION_TEMPLATE]: {
    loader: medicationTemplateLoader,
  },
  [REFERENCE_TYPES.MEDICATION_SET]: {
    loader: medicationSetLoader,
  },
  [REFERENCE_TYPES.PROCEDURE_TYPE]: {
    loader: procedureTypeLoader,
  },
};
