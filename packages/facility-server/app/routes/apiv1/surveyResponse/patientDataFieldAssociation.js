import asyncHandler from 'express-async-handler';

import { PATIENT_DATA_FIELD_LOCATIONS } from '@tamanu/constants';
import { InvalidParameterError } from '@tamanu/errors';
import { getPatientDataFieldAssociationData } from '@tamanu/shared/reports/utilities/transformAnswers';

export const patientDataFieldAssociationGetHandler = asyncHandler(async (req, res) => {
  const { models, params, query } = req;
  const value = query.value;
  const column = params.column;

  req.checkPermission('read', 'Patient');

  if (!column) {
    throw new InvalidParameterError('Column parameter is required');
  }
  if (!value) {
    res.json({
      data: null,
    });
    return;
  }

  if (!PATIENT_DATA_FIELD_LOCATIONS[column]) {
    throw new InvalidParameterError('Invalid column');
  }

  const [modelName, fieldName] = PATIENT_DATA_FIELD_LOCATIONS[column];

  const { data, targetModel } = await getPatientDataFieldAssociationData({
    models,
    modelName,
    fieldName,
    answer: value,
  });

  res.json({
    model: targetModel,
    data,
  });
});
