import config from 'config';

import express from 'express';
import asyncHandler from 'express-async-handler';
import { LAB_REQUEST_STATUSES, LAB_TEST_STATUSES } from 'shared/constants';

export const labResultWidgetRoutes = express.Router();

const getPatientInitials = patient => `${patient.firstName ? patient.firstName.substring(0, 1) : ''}${patient.middleName ? patient.middleName.substring(0, 1) : ''}${patient.lastName ? patient.lastName.substring(0, 1) : ''}`;

const transformLabRequest = async (models, labRequest) => {
  const { id, createdAt, encounterId, status } = labRequest;
  const encounter = await models.Encounter.findOne({ where: { id: encounterId } });
  const patient = await models.Patient.findOne({ where: { id: encounter.patientId } });
  if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    return {
      testDate: createdAt,
      patientInitials: getPatientInitials(patient),
      testResults: [],
    }
  }

  const labTests = await models.LabTest.findOne({
    where: {
      labRequestId: id,
    }
  });

  const returnableLabTests = labTests.filter(({ labTestTypeId }) => config.testTypeWhitelist.includes(labTestTypeId));

  return {
    testDate: createdAt,
    patientInitials: getPatientInitials(patient),
    testResults: returnableLabTests.map(({ result, status, labTestTypeId }) => ({
      testType: labTestTypeId,
      result: status === LAB_TEST_STATUSES.PUBLISHED ? result : 'Result not available yet'
    })),
  };
}

labResultWidgetRoutes.get(
  '/:displayId',
  asyncHandler(async (req, res) => {
    const { params } = req;
    const { displayId } = params;
    const { models } = req.store;
    const labRequests = await models.LabRequest.findAll({
      where: {
        id: displayId,
      },
    });
    const returnableLabRequests = labRequests.filter(({ labTestCategoryId }) => config.categoryWhitelist.includes(labTestCategoryId));

    const labRequestsToReport = await Promise.all(returnableLabRequests.map(labRequest => transformLabRequest(models, labRequest)));

    res.send({
      data: labRequestsToReport,
    });
  }),
);
