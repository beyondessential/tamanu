import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';

// completedAt is always prefilled, so a clinician (chosen, or defaulted to the current user when the
// status changes to completed) or a description is what shows there is a result to record.
// Otherwise a result is written purely to record the completion time, and only if there is none.
export const shouldSubmitImagingResult = (values, imagingRequest) => {
  if (values.status !== IMAGING_REQUEST_STATUS_TYPES.COMPLETED) return false;
  if (values.newResult?.completedById || values.newResult?.description) return true;
  return (
    imagingRequest.status !== IMAGING_REQUEST_STATUS_TYPES.COMPLETED &&
    !imagingRequest.results?.length
  );
};
