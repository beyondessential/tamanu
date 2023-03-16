import React from 'react';

import { SimplePrintout } from './reusable/SimplePrintout';
import { useLocalisation } from '../../../contexts/Localisation';
import { DateDisplay } from '../../DateDisplay';
import { getFullLocationName } from '../../../utils/location';

export const ImagingRequestPrintout = React.memo(
  ({ imagingRequestData, patientData, encounterData, certificateData }) => {
    const {
      displayId,
      requestedDate,
      requestedBy,
      priority,
      imagingType,
      areas,
      areaNote,
      note,
    } = imagingRequestData;
    const { getLocalisation } = useLocalisation();
    const imagingTypes = getLocalisation('imagingTypes') || {};
    const imagingPriorities = getLocalisation('imagingPriorities') || [];

    return (
      <SimplePrintout
        patientData={patientData}
        notes={[{ content: note }]}
        certificateData={{ ...certificateData, pageTitle: 'Imaging Request' }}
        tableData={{
          'Request ID': displayId,
          'Request date': requestedDate ? <DateDisplay date={requestedDate} /> : null,
          Facility: encounterData?.location?.facility?.name,
          Department: encounterData?.department?.name,
          Location: getFullLocationName(encounterData?.location),
          'Requested by': requestedBy?.displayName,
          Priority: imagingPriorities.find(p => p.value === priority)?.label || '',
          'Imaging type': imagingTypes[imagingType]?.label || 'Unknown',
          'Areas to be imaged': areas?.length ? areas.map(area => area.name).join(', ') : areaNote,
        }}
      />
    );
  },
);
