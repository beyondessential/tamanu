import React from 'react';
import moment from 'moment';

import { SimplePrintout } from './SimplePrintout';
import { useLocalisation } from '../../contexts/Localisation';

export const ImagingRequestPrintout = React.memo(
  ({ imagingRequestData, patientData, encounterData, certificateData }) => {
    const {
      id,
      requestedDate,
      requestedBy,
      urgent,
      imagingType,
      areas,
      areaNote,
      note,
    } = imagingRequestData;
    const { getLocalisation } = useLocalisation();
    const imagingTypes = getLocalisation('imagingTypes') || {};

    return (
      <SimplePrintout
        patientData={patientData}
        notes={[{ content: note }]}
        certificateData={{ ...certificateData, pageTitle: 'Imaging Request' }}
        tableData={{
          'Request ID': id,
          'Request date': requestedDate ? moment(requestedDate).format('DD/MM/YYYY') : null,
          Facility: encounterData?.location?.facility?.name,
          Department: encounterData?.department?.name,
          'Requested by': requestedBy?.displayName,
          Urgent: urgent ? 'Yes' : 'No',
          'Imaging type': imagingTypes[imagingType]?.label || 'Unknown',
          'Areas to be imaged': areas?.length ? areas.map(area => area.name).join(', ') : areaNote,
        }}
      />
    );
  },
);
