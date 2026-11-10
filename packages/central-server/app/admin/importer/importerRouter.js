import express from 'express';

import { createDataImporterEndpoint } from './importerEndpoint';
import { programImporter } from '../programImporter';
import { referenceDataImporter } from '../referenceDataImporter';
import { surveyResponsesImporter } from '../surveyResponsesImporter';
import { insurancePlanPaymentImporter } from '../invoice/insurancePlanPaymentImporter';

export const importerRouter = express.Router();
importerRouter.post('/program', createDataImporterEndpoint(programImporter));
importerRouter.post('/referenceData', createDataImporterEndpoint(referenceDataImporter));
importerRouter.post('/surveyResponses', createDataImporterEndpoint(surveyResponsesImporter));
importerRouter.post('/insurancePlanPayments', createDataImporterEndpoint(insurancePlanPaymentImporter));
