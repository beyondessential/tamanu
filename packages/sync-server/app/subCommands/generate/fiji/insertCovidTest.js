import { fake } from 'shared/test-helpers';
import { LAB_TEST_STATUSES, LAB_REQUEST_STATUSES } from 'shared/constants';
import { chance } from './chance';

export const insertCovidTest = async ({ LabTest, LabRequest }, setupData, { encounterId }) => {
  const labRequest = await LabRequest.create({
    ...fake(LabRequest),
    labTestCategoryId: chance.pickone(setupData.covidTestCategories),
    status: chance.pickone(
      Object.values(LAB_REQUEST_STATUSES).filter(s => s !== LAB_REQUEST_STATUSES.DELETED),
    ),
    encounterId,
  });
  return LabTest.create({
    ...fake(LabTest),
    labRequestId: labRequest.id,
    date: chance.date({ year: chance.integer({ min: 1970, max: 2021 }) }),
    status: LAB_TEST_STATUSES.RECEPTION_PENDING, // LabTest.status isn't set in prod
  });
};
