import { IMAGING_REQUEST_STATUS_TYPES, IMAGING_TYPES } from '@tamanu/constants';
import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateImagingRequestParams {
  models: Models;
  userId: string;
  encounterId: string;
  locationGroupId: string;
}
export const createImagingRequest = async ({
  models: { ImagingRequest, ImagingResult },
  userId,
  encounterId,
  locationGroupId,
}: CreateImagingRequestParams): Promise<void> => {
  const imagingRequest = await ImagingRequest.create(
    fake(ImagingRequest, {
      requestedById: userId,
      encounterId,
      locationGroupId,
      status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
      priority: 'routine',
      requestedDate: '2022-03-04 15:30:00',
      imagingType: IMAGING_TYPES.X_RAY,
    }),
  );

  await ImagingResult.create(
    fake(ImagingResult, {
      imagingRequestId: imagingRequest.id,
      completedById: userId,
      description: 'This is a test result',
      completedAt: '2022-03-04 15:30:00',
    }),
  );
};
