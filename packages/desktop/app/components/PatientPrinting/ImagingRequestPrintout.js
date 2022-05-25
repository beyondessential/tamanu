import React from 'react';
import moment from 'moment';

import { SimplePrintout } from './SimplePrintout';
import { LoadingIndicator } from '../LoadingIndicator';

export const ImagingRequestPrintout = React.memo(
  ({ imagingRequestData, patientData, encounterData, certificateData, isLoading }) => {
    const {
      id,
      requestedDate,
      requestedBy,
      urgent,
      imagingType,
      areaToBeImaged,
      note,
    } = imagingRequestData;

    if (isLoading) {
      return <LoadingIndicator />;
    }

    return (
      <SimplePrintout
        patientData={patientData}
        notes={[{ content: note }]}
        certificateData={{ ...certificateData, pageTitle: 'Imaging Request' }}
        tableData={{
          'Request code': id,
          'Request date': requestedDate ? moment(requestedDate).format('DD/MM/YYYY') : null,
          Facility: encounterData?.location?.Facility?.name,
          Department: encounterData?.department?.name,
          'Requested by': requestedBy?.displayName,
          Urgent: urgent ? 'Yes' : 'No',
          'Request type': imagingType?.name,
          'Area to be imaged': areaToBeImaged,
        }}
      />
    );
  },
);
