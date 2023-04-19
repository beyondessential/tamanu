import React from 'react';

import { useImagingRequest } from '../../../../api/queries/useImagingRequest';
import { DateDisplay } from '../../../DateDisplay';

export const ImagingRequestData = ({ imagingRequestId, dataType }) => {
  const imagingRequestQuery = useImagingRequest(imagingRequestId);
  const imagingRequest = imagingRequestQuery.data;
  if (dataType === 'areas') {
    const areas = imagingRequest?.areas?.length
      ? imagingRequest?.areas.map(area => area.name).join(', ')
      : imagingRequest?.areaNote;
    return <p style={{ margin: '0' }}>{areas}</p>;
  }
  if (dataType === 'completedDate') {
    return (
      <p style={{ margin: '0' }}>
        {imagingRequest?.results[0]?.completedAt ? (
          <DateDisplay date={imagingRequest?.results[0]?.completedAt} />
        ) : (
          '--/--/----'
        )}
      </p>
    );
  }
  return null;
};
