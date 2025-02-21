import { fake } from '@tamanu/data-generation/helpers';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { chance } from '../../../chance';

export const insertCovidTest = async ({ LabTest, LabRequest }, setupData, { encounterId }) => {
  const labRequest = await LabRequest.create({
    ...fake(LabRequest),
    labTestCategoryId: chance.pickone(setupData.labTestCategories).id,
    status: chance.pickone(
      Object.values(LAB_REQUEST_STATUSES).filter((s) => s !== LAB_REQUEST_STATUSES.DELETED),
    ),
    encounterId,
  });
  return LabTest.create({
    ...fake(LabTest),
    labRequestId: labRequest.id,
    date: chance.date({ year: chance.integer({ min: 1970, max: 2021 }) }),
  });
};
