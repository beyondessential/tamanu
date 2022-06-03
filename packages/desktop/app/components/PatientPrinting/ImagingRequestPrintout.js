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
          'Request date': requestedDate ? moment(requestedDate).format('DD/MM/YYYY') : null,
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
