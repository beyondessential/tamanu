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
          category={area.type}
          data-test-id='translatedreferencedata-eoiz' />
      </span>).join(', ')
      : imagingRequest?.areaNote;
    return <p style={{ margin: '0' }} data-test-id='p-kvwd'>{areas}</p>;
  }
  if (dataType === 'completedDate') {
    return (
      <p style={{ margin: '0' }} data-test-id='p-ggu5'>
        {imagingRequest?.results[0]?.completedAt ? (
          <DateDisplay
            date={imagingRequest?.results[0]?.completedAt}
            data-test-id='datedisplay-9tzj' />
        ) : (
          '--/--/----'
        )}
      </p>
    );
  }
  return null;
};
