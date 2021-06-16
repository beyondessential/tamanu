import express from 'express';
import asyncHandler from 'express-async-handler';
import { InvalidParameterError } from 'shared/errors';
import { LAB_REQUEST_STATUSES } from 'shared/constants';

export const covidResultRoutes = express.Router();

const COVID_LAB_TEST_CATEGORY_ID = 'labTestCategory-FBC';
const COVID_SWAB_LAB_TEST_TYPE_ID = 'labTestType-Lymphocytes';

const getPatientInitials = patient => `${patient.firstName ? patient.firstName.substring(0, 1) : ''}${patient.middleName ? patient.middleName.substring(0, 1) : ''}${patient.lastName ? patient.lastName.substring(0, 1) : ''}`;

const transformLabRequest = async (models, labRequest) => {
  const { id, createdAt, encounterId, status } = labRequest;
  const encounter = await models.Encounter.findOne({ where: { id: encounterId } });
  const patient = await models.Patient.findOne({ where: { id: encounter.patientId } });

  const { result } = await models.LabTest.findOne({
    where: {
      labRequestId: id,
      labTestTypeId: COVID_SWAB_LAB_TEST_TYPE_ID
    }
  });

  return {
    testDate: createdAt,
    patientInitials: getPatientInitials(patient),
    testResult: status === LAB_REQUEST_STATUSES.PUBLISHED ? result : 'Result not available yet',
  };
}

covidResultRoutes.get(
  '/:displayId',
  asyncHandler(async (req, res) => {
    const { params } = req;
    const { displayId } = params;
    const { models } = req.store;
    const labRequests = await models.LabRequest.findAll({
      where: {
        id: displayId,
        labTestCategoryId: COVID_LAB_TEST_CATEGORY_ID,
      },
    });

    const labRequestsToReport = await Promise.all(labRequests.map(labRequest => transformLabRequest(models, labRequest)));

    res.send({
      data: labRequestsToReport,
    });
  }),
);
