import {
  patientDataLoader,
  administeredVaccineLoader,
  roleLoader,
  permissionLoader,
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
// creating dependency cycles is a sin (it will deadloop, don't do it)
export default {
  user: {},

  patient: {
    loader: patientDataLoader,
    needs: ['user'],
  },

  facility: {},
  department: {
    needs: ['facility'],
  },
  location: {
    needs: ['facility'],
  },

  certifiableVaccine: {},
  scheduledVaccine: {},
  administeredVaccine: {
    loader: administeredVaccineLoader,
    needs: ['scheduledVaccine', 'user', 'location', 'department'],
  },

  labTestType: {},
  invoicePriceChangeType: {},
  invoiceLineType: {
    needs: ['labTestType'],
  },

  role: {
    loader: roleLoader,
  },
  permission: {
    loader: permissionLoader,
    needs: ['role'],
  },
};
