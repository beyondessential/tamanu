import express from 'express';
import asyncHandler from 'express-async-handler';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';

export const labResultWidgetRoutes = express.Router();

const getInitial = s => (s ? s[0] : '');

const getPatientInitials = ({ firstName, middleName, lastName }) =>
  `${getInitial(firstName)}${getInitial(middleName)}${getInitial(lastName)}`;

const transformLabRequest = async (models, labRequest, testTypeWhitelist) => {
  const { id, createdAt, encounterId, status } = labRequest;
  const encounter = await models.Encounter.findOne({ where: { id: encounterId } });
  const patient = await models.Patient.findOne({ where: { id: encounter.patientId } });
  if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    return {
      testDate: createdAt,
      patientInitials: getPatientInitials(patient),
      testResults: [],
    };
  }

  // Note that we're not filtering on publication status of lab tests, only
  // lab requests. (this is just because currently (2021-07-05) there's
  // actually no way in the UI to publish a lab test)
  const labTests = await models.LabTest.findAll({
    where: {
      labRequestId: id,
    },
  });

  const returnableLabTests = labTests.filter(({ labTestTypeId }) =>
    testTypeWhitelist.includes(labTestTypeId),
  );

  return {
    testDate: createdAt,
    patientInitials: getPatientInitials(patient),
    testResults: returnableLabTests.map(({ result }) => ({
      result,
    })),
  };
};

labResultWidgetRoutes.get(
  '/:displayId',
  asyncHandler(async (req, res) => {
    const { params, settings } = req;
    const { displayId } = params;
    const { models } = req.store;
    const { testTypeWhitelist, categoryWhitelist } = await settings.get('labResultWidget');
    const labRequests = await models.LabRequest.findAll({
      where: {
        display_id: displayId,
      },
    });

    const returnableLabRequests = labRequests.filter(({ labTestCategoryId }) =>
      categoryWhitelist.includes(labTestCategoryId),
    );

    const labRequestsToReport = await Promise.all(
      returnableLabRequests.map(labRequest =>
        transformLabRequest(models, labRequest, testTypeWhitelist),
      ),
    );

    res.send({
      data: labRequestsToReport,
    });
  }),
);
