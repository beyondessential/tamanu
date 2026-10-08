import { IMAGING_REQUEST_STATUS_TYPES, IMAGING_TYPES } from '@tamanu/constants';
import { randomRecordId } from '../randomRecord.js';

import { addHours } from 'date-fns';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { fake, chance, fakeDate } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateImagingRequestParams extends CommonParams {
  userId?: string;
  encounterId?: string;
  locationGroupId?: string;
  isResulted?: boolean;
}
export const createImagingRequest = async ({
  models,
  userId,
  encounterId,
  locationGroupId,
  isResulted,
}: CreateImagingRequestParams): Promise<void> => {
  const { ImagingRequest, ImagingResult } = models;
  const status = chance.pickone(Object.values(IMAGING_REQUEST_STATUS_TYPES));
  const requestedDate = fakeDate();
  const imagingRequest = await ImagingRequest.create(
    fake(ImagingRequest, {
      requestedById: userId || (await randomRecordId(models, 'User')),
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
      locationGroupId: locationGroupId || (await randomRecordId(models, 'LocationGroup')),
      status,
      priority: 'routine',
      requestedDate: toDateTimeString(requestedDate),
      imagingType: chance.pickone(Object.values(IMAGING_TYPES)),
    }),
  );

  if (isResulted ?? status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED) {
    await ImagingResult.create(
      fake(ImagingResult, {
        imagingRequestId: imagingRequest.id,
        completedById: userId || (await randomRecordId(models, 'User')),
        completedAt: toDateTimeString(addHours(requestedDate, chance.integer({ min: 1, max: 72 }))),
      }),
    );
  }
};
