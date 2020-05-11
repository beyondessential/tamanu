import defaults from './defaults';
import { OPERATION_PLAN_STATUSES } from '../constants';

export const OperativePlanSchema = {
  name: 'operativePlan',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    additionalNotes: {
      type: 'string',
      optional: true,
    },
    admissionInstructions: {
      type: 'string',
      optional: true,
    },
    caseComplexity: {
      type: 'string',
      optional: true,
    },
    operationDescription: {
      type: 'string',
      optional: true,
    },
    actionsTaken: 'string[]',
    status: {
      type: 'string',
      optional: true,
      default: OPERATION_PLAN_STATUSES.PLANNED,
    },
    surgeon: {
      type: 'string',
      optional: true,
    },
    diagnoses: {
      type: 'list',
      objectType: 'patientDiagnosis',
    },
    visit: {
      type: 'linkingObjects',
      objectType: 'visit',
      property: 'operativePlans',
    },
    ...defaults,
  },
};
