import defaults from './defaults';
import { OPERATION_PLAN_STATUSES } from '../constants';

export const OpPlanSchema = {
  name: 'operationPlan',
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
    procedures: 'string[]',
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
    ...defaults,
  },
};
