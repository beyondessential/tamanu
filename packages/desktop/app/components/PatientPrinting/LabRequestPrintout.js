import React from 'react';

import { SimplePrintout } from './SimplePrintout';
import { DateDisplay } from '../DateDisplay';

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
          'Request date': requestedDate ? <DateDisplay date={requestedDate} /> : null,
          Facility: encounterData?.location?.facility?.name,
          Department: encounterData?.department?.name,
          'Requested by': requestedBy?.displayName,
          'Sample time': sampleTime ? <DateDisplay date={sampleTime} /> : null,
          Priority: priority?.name,
          'Test type': category?.name,
          'Test requested': tests.map(test => test.labTestType?.name).join(', '),
        }}
      />
    );
  },
);
