import React from 'react';
import { format } from 'date-fns';

import { SimplePrintout } from './SimplePrintout';

export const ImagingRequestPrintout = React.memo(
  ({ imagingRequestData, patientData, encounterData, certificateData }) => {
    const {
      id,
      requestedDate,
      requestedBy,
      urgent,
      imagingType,
      areaToBeImaged,
      note,
    } = imagingRequestData;

    return (
      <SimplePrintout
        patientData={patientData}
        notes={[{ content: note }]}
        certificateData={{ ...certificateData, pageTitle: 'Imaging Request' }}
        tableData={{
          'Request ID': id,
          'Request date': requestedDate ? format(requestedDate, 'dd/MM/yyyy') : null,
          Facility: encounterData?.location?.facility?.name,
          Department: encounterData?.department?.name,
          'Requested by': requestedBy?.displayName,
          Urgent: urgent ? 'Yes' : 'No',
          'Imaging type': imagingType?.name,
          'Area to be imaged': areaToBeImaged,
        }}
      />
    );
  },
);
