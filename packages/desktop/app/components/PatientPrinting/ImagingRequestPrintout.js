import React from 'react';
import moment from 'moment';

import { SimplePrintout } from './SimplePrintout';

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
          // TODO: need to correct this for new imaging type enum style
          'Imaging type': imagingType?.name,
          'Areas to be imaged': areas ? areas.map(area => area.name).join(', ') : areaNote,
        }}
      />
    );
  },
);
