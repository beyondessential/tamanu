import { fake } from 'shared/test-helpers';
import { LAB_REQUEST_STATUSES } from 'shared/constants';
import { chance } from './chance';

export const insertLabTest = async ({ LabTest, LabRequest }, setupData, { encounterId }) => {
  const labRequest = await LabRequest.create({
    ...fake(LabRequest),
    labTestCategoryId: chance.pickone(setupData.labTestCategories),
    status: chance.pickone(
      Object.values(LAB_REQUEST_STATUSES).filter(s => s !== LAB_REQUEST_STATUSES.DELETED),
    ),
    encounterId,
  });
  await LabTest.create({
    ...fake(LabTest),
    labRequestId: labRequest.id,
  });
};
