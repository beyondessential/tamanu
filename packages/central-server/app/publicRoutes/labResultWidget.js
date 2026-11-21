import express from 'express';
import asyncHandler from 'express-async-handler';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';

const getInitial = s => (s ? s[0] : '');

const getPatientInitials = ({ firstName, middleName, lastName }) =>
  `${getInitial(firstName)}${getInitial(middleName)}${getInitial(lastName)}`;

// Note that we're not filtering on publication status of lab tests, only
// lab requests. (this is just because currently (2021-07-05) there's
// actually no way in the UI to publish a lab test)
const toWidgetResult = ({ createdAt, status, encounter, tests }) => ({
  testDate: createdAt,
  patientInitials: getPatientInitials(encounter.patient),
  testResults:
    status === LAB_REQUEST_STATUSES.PUBLISHED ? tests.map(({ result }) => ({ result })) : [],
});

// spec: LPUB
// Exported as a factory so createApi can inject the shared rate-limiter instance.
export const labResultWidgetRoutes = ({ labResultWidgetLimiter }) => {
  const router = express.Router();
  router.get(
    '/:displayId',
    labResultWidgetLimiter,
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { displayId } = params;
      const { models } = req.store;
      // Patient data on an unauthenticated GET: keep it out of browser and proxy caches.
      res.set('Cache-Control', 'no-store');

      const { testTypeWhitelist, categoryWhitelist } = await req.settings.get('labResultWidget');
      if (categoryWhitelist.length === 0) {
        res.send({ data: [] });
        return;
      }

      const labRequests = await models.LabRequest.findAll({
        where: {
          displayId,
          labTestCategoryId: categoryWhitelist,
        },
        include: [
          {
            model: models.Encounter,
            as: 'encounter',
            attributes: ['id'],
            include: [
              {
                model: models.Patient,
                as: 'patient',
                attributes: ['firstName', 'middleName', 'lastName'],
              },
            ],
          },
          {
            model: models.LabTest,
            as: 'tests',
            attributes: ['result'],
            where: { labTestTypeId: testTypeWhitelist },
            required: false,
          },
        ],
      });

      res.send({ data: labRequests.map(toWidgetResult) });
    }),
  );
  return router;
};
