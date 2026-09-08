import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';

// completedAt is prefilled, so on a request that is already completed only a clinician or a
// description means the user entered a result; without that check every save appends a blank row.
export const shouldSubmitImagingResult = (values, currentStatus) => {
  if (values.status !== IMAGING_REQUEST_STATUS_TYPES.COMPLETED) return false;
  if (currentStatus !== IMAGING_REQUEST_STATUS_TYPES.COMPLETED) return true;
  return Boolean(values.newResult?.completedById || values.newResult?.description);
};
