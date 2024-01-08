import {
  administeredVaccineLoader,
  patientDataLoader,
  patientFieldDefinitionLoader,
  permissionLoader,
  labTestPanelLoader,
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
  user: {},

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
  invoicePriceChangeType: {},
  invoiceLineType: {
    needs: ['labTestType'],
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
};
