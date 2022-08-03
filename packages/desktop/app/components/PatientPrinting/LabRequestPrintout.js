import React from 'react';
import { format } from 'date-fns';

import { SimplePrintout } from './SimplePrintout';

export const LabRequestPrintout = React.memo(
  ({ labRequestData, patientData, encounterData, certificateData }) => {
    const {
      displayId,
      requestedDate,
      sampleTime,
      requestedBy,
      priority,
      category,
      tests,
      notes,
    } = labRequestData;

    return (
      <SimplePrintout
        patientData={patientData}
        notes={notes}
        certificateData={{ ...certificateData, pageTitle: 'Lab Request' }}
        tableData={{
          'Test ID': displayId,
          'Request date': requestedDate ? format(requestedDate, 'dd/MM/yyyy') : null,
          Facility: encounterData?.location?.facility?.name,
          Department: encounterData?.department?.name,
          'Requested by': requestedBy?.displayName,
          'Sample time': sampleTime ? format(sampleTime, 'dd/MM/yyyy hh:mm a') : null,
          Priority: priority?.name,
          'Test type': category?.name,
          'Test requested': tests.map(test => test.labTestType?.name).join(', '),
        }}
      />
    );
  },
);
