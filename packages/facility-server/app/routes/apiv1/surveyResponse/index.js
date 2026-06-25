import express from 'express';

import { complexChartInstancePutHandler } from './complexChartInstance';
import { patientDataFieldAssociationGetHandler } from './patientDataFieldAssociation';
import { surveyResponseGetHandler } from './surveyResponse.get';
import { surveyResponsePatchHandler } from './surveyResponse.patch';
import { surveyResponsePostHandler } from './surveyResponse.post';
import { surveyResponseChangesGetHandler } from './changes';

export { createSurveyResponse, surveyResponsePostHandler } from './surveyResponse.post';

export const surveyResponse = express.Router();

surveyResponse.get('/:id/changes', surveyResponseChangesGetHandler);

surveyResponse.get('/:id', surveyResponseGetHandler);

surveyResponse.post('/', surveyResponsePostHandler);

surveyResponse.patch('/:id', surveyResponsePatchHandler);

surveyResponse.put('/complexChartInstance/:id', complexChartInstancePutHandler);

surveyResponse.get(
  '/patient-data-field-association-data/:column',
  patientDataFieldAssociationGetHandler,
);
