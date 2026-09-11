import { OTHER_REFERENCE_TYPES, PSEUDO_REFERENCE_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import { invoiceInsurancePlanItemLoaderFactory } from './invoiceInsurancePlanItemLoaderFactory';
import { invoicePriceListChargingLoaderFactory } from './invoicePriceListChargingLoaderFactory';
import { invoicePriceListItemLoaderFactory } from './invoicePriceListItemLoaderFactory';
import { invoicePriceListLoader } from './invoicePriceListLoader';
import {
  administeredVaccineLoader,
  drugLoaderFactory,
  invoiceProductLoader,
  labTestCategoryLoader,
  labTestPanelLoader,
  medicationSetLoader,
  medicationTemplateLoader,
  patientDataLoader,
  patientFieldDefinitionLoader,
  permissionLoader,
  procedureTypeLoader,
  taskSetLoader,
  taskTemplateLoader,
  translatedStringLoader,
  userLoader,
} from './loaders';

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
  // The reference-data pass creates the labTestCategory rows; this second pass reads the optional
  // defaultSpecimenType column into a relation. Specimen types are guaranteed present as they are
  // imported in the reference-data pass, which completes before this one.
  [REFERENCE_TYPES.LAB_TEST_CATEGORY]: {
    loader: labTestCategoryLoader,
  },
  invoiceProduct: {
    loader: invoiceProductLoader,
    needs: [OTHER_REFERENCE_TYPES.LAB_TEST_TYPE, OTHER_REFERENCE_TYPES.LAB_TEST_PANEL],
  },

  invoicePriceList: {
    loader: invoicePriceListLoader,
  },
  invoicePriceListItem: {
    get loader() {
      // Use a getter to create a fresh loader instance on each access
      return invoicePriceListItemLoaderFactory();
    },
    needs: ['invoicePriceList', 'invoiceProduct'],
  },
  [PSEUDO_REFERENCE_TYPES.INVOICE_PRICE_LIST_CHARGING]: {
    // Sets isFixedPrice on the same InvoicePriceListItem rows; runs after the price items exist
    // so it reuses their ids and merges onto the same rows.
    model: 'InvoicePriceListItem',
    get loader() {
      return invoicePriceListChargingLoaderFactory();
    },
    needs: ['invoicePriceList', 'invoiceProduct', 'invoicePriceListItem'],
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
    get loader() {
      // Use a getter to create a fresh loader instance (with its own per-import
      // settings cache) on each access.
      return drugLoaderFactory();
    },
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
