import React from 'react';

import { useImagingRequestQuery } from '../../../../api/queries/useImagingRequestQuery';
import { DateDisplay } from '../../../DateDisplay';
import { TranslatedReferenceData } from '../../../Translation';

export const ImagingRequestData = ({ imagingRequestId, dataType }) => {
  const imagingRequestQuery = useImagingRequestQuery(imagingRequestId);
  const imagingRequest = imagingRequestQuery.data;
  if (dataType === 'areas') {
    const areas = imagingRequest?.areas?.length
      ? imagingRequest?.areas.map(area => <span
        key={area.id}
      >
        <TranslatedReferenceData
          fallback={area.name}
          value={area.id}
          category={area.type} />
      </span>).join(', ')
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
