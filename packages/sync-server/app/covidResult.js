import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError } from 'shared/errors';
import { LAB_REQUEST_STATUSES } from 'shared/constants';

export const covidResultRoutes = express.Router();

const COVID_LAB_TEST_CATEGORY_ID = 'labTestCategory-FBC';
const COVID_SWAB_LAB_TEST_TYPE_ID = 'labTestType-Lymphocytes';

const getPatientInitials = patient => `${patient.firstName ? patient.firstName.substring(0, 1) : ''}${patient.middleName ? patient.middleName.substring(0, 1) : ''}${patient.lastName ? patient.lastName.substring(0, 1) : ''}`;

covidResultRoutes.get(
  '/:displayId',
  asyncHandler(async (req, res) => {
    const { query, params } = req;
    const { displayId } = params;
    const { models } = req.store;
    const labRequest = await models.LabRequest.findOne({
      where: {
        id: displayId,
        labTestCategoryId: COVID_LAB_TEST_CATEGORY_ID,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!labRequest) {
      // Not too sure about this error...
      throw new ForbiddenError('You do not have permission to view this labRequest.');
    }

    const { status, createdAt, encounterId } = labRequest;
    const encounter = await models.Encounter.findOne({ where: { id: encounterId } });
    const patient = await models.Patient.findOne({ where: { id: encounter.patientId } });

    const { result } = await models.LabTest.findOne({
      where: {
        labRequestId: displayId,
        labTestTypeId: COVID_SWAB_LAB_TEST_TYPE_ID
      }
    });

    if (status !== LAB_REQUEST_STATUSES.PUBLISHED) {
      throw new ForbiddenError('You do not have permission to view this labRequest until results are published');
    }

    res.send({
      data: {
        testDate: createdAt,
        patientInitials: getPatientInitials(patient),
        testResult: result,
      }
    });
  }),
);
