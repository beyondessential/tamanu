import { IMAGING_REQUEST_STATUS_TYPES, IMAGING_TYPES } from '@tamanu/constants';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateImagingRequestParams extends CommonParams {
  userId: string;
  encounterId: string;
  locationGroupId: string;
  isResulted?: boolean;
  areaIds?: string[];
}
export const createImagingRequest = async ({
  models,
  userId,
  encounterId,
  locationGroupId,
  isResulted = chance.bool(),
  areaIds = [],
}: CreateImagingRequestParams): Promise<void> => {
  const { ImagingRequest, ImagingResult, ImagingRequestArea } = models;
  const imagingRequest = await ImagingRequest.create(
    fake(ImagingRequest, {
      requestedById: userId || (await randomRecordId(models, 'User')),
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
      locationGroupId: locationGroupId || (await randomRecordId(models, 'LocationGroup')),
      status: chance.pickone(Object.values(IMAGING_REQUEST_STATUS_TYPES)),
      priority: 'routine',
      requestedDate: '2022-03-04 15:30:00',
      imagingType: chance.pickone(Object.values(IMAGING_TYPES)),
    }),
  );

  await Promise.all(
    areaIds.map(areaId =>
      ImagingRequestArea.create(
        fake(ImagingRequestArea, {
          imagingRequestId: imagingRequest.id,
          areaId: areaId,
        }),
      ),
    ),
  );

  if (isResulted) {
    await ImagingResult.create(
      fake(ImagingResult, {
        imagingRequestId: imagingRequest.id,
        completedById: userId || (await randomRecordId(models, 'User')),
        description: 'This is a test result',
        completedAt: '2022-03-04 15:30:00',
      }),
    );
  }
};
