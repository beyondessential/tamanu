import React from 'react';

import { SimplePrintout } from './reusable/SimplePrintout';
import { useLocalisation } from '../../../contexts/Localisation';
import { DateDisplay } from '../../DateDisplay';
import { getFullLocationName } from '../../../utils/location';

export const ImagingRequestPrintout = React.memo(
  ({ imagingRequest, patient, encounter, certificate, village, additionalData }) => {
    const {
      displayId,
      requestedDate,
      requestedBy,
      priority,
      imagingType,
      areas,
      areaNote,
      note,
    } = imagingRequest;
    const { getLocalisation } = useLocalisation();
    const imagingTypes = getLocalisation('imagingTypes') || {};
    const imagingPriorities = getLocalisation('imagingPriorities') || [];

    return (
      <SimplePrintout
        patient={patient}
        village={village}
        additionalData={additionalData}
        notes={[{ content: note }]}
        certificate={{ ...certificate, pageTitle: 'Imaging Request' }}
        tableData={{
          'Request ID': displayId,
          'Request date': requestedDate ? <DateDisplay date={requestedDate} /> : null,
          Facility: encounter?.location?.facility?.name,
          Department: encounter?.department?.name,
          Location: getFullLocationName(encounter?.location),
          'Requested by': requestedBy?.displayName,
          Priority: imagingPriorities.find(p => p.value === priority)?.label || '',
          'Imaging type': imagingTypes[imagingType]?.label || 'Unknown',
          'Areas to be imaged': areas?.length ? areas.map(area => area.name).join(', ') : areaNote,
        }}
      />
    );
  },
);
