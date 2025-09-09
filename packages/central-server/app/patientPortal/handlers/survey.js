
import asyncHandler from 'express-async-handler';
import { log } from '@tamanu/shared/services/logging';
import {
  SurveySchema,
  SurveyWithComponentsSchema,
} from '@tamanu/shared/schemas/patientPortal/responses/survey.schema';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { getAttributesFromSchema } from '../utils/schemaUtils';
import { NotFoundError } from '@tamanu/shared/errors';

export const getSurvey = asyncHandler(async (req, res) => {
    const { patient, params } = req;
    const { models } = req.store;
    const { assignmentId } = params;
  
    const assignedSurvey = await models.PortalSurveyAssignment.findOne({
      where: {
        id: assignmentId,
        patientId: patient.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      },
    });
  
    if (!assignedSurvey) {
      log.error('Patient attempted to fetch survey for invalid assigned survey', {
        assignmentId,
        patientId: patient.id,
      });
      throw new NotFoundError('Survey was not assigned to the patient');
    }
  
    const surveyRecord = await models.Survey.findByPk(assignedSurvey.surveyId, {
      attributes: getAttributesFromSchema(SurveySchema),
    });
  
    if (!surveyRecord) {
      log.error('Unexpected survey not found, assignment has invalid surveyId', {
        assignmentId,
        surveyId: assignedSurvey.surveyId,
      });
      throw new NotFoundError('Survey was not found');
    }
  
    const components = await models.SurveyScreenComponent.getComponentsForSurvey(surveyRecord.id, {
      includeAllVitals: true,
    });
  
    const payload = {
      ...surveyRecord.forResponse(),
      components,
    };
  
    return res.send(SurveyWithComponentsSchema.parse(payload));
  });
