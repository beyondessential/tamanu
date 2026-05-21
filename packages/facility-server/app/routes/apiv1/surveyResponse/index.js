import express from 'express';

import { complexChartInstancePutHandler } from './complexChartInstance';
import { patientDataFieldAssociationGetHandler } from './patientDataFieldAssociation';
import { surveyResponseGetHandler } from './surveyResponse.get';
import { surveyResponsePostHandler } from './surveyResponse.post';

export { surveyResponsePostHandler } from './surveyResponse.post';

export const surveyResponse = express.Router();

surveyResponse.get('/:id', surveyResponseGetHandler);

surveyResponse.post('/', surveyResponsePostHandler);

surveyResponse.put('/complexChartInstance/:id', complexChartInstancePutHandler);

surveyResponse.get(
  '/patient-data-field-association-data/:column',
  patientDataFieldAssociationGetHandler,
);
