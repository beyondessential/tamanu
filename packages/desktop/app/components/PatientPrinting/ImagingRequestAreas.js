import React from 'react';

import { useImagingRequest } from '../../api/queries/useImagingRequest';

export const ImagingRequestAreas = ({ imagingRequestId }) => {
  const imagingRequestQuery = useImagingRequest(imagingRequestId);
  const imagingRequest = imagingRequestQuery.data;
  const areas = imagingRequest?.areas?.length
    ? imagingRequest?.areas.map(area => area.name).join(', ')
    : imagingRequest?.areaNote;
  return <p style={{ margin: '0' }}>{areas}</p>;
};
