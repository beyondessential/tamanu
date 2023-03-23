import React from 'react';

import { SimplePrintout } from './reusable/SimplePrintout';
import { DateDisplay } from '../../DateDisplay';
import { getFullLocationName } from '../../../utils/location';

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
          'Request date': requestedDate ? <DateDisplay date={requestedDate} showTime /> : null,
          Facility: encounterData?.location?.facility?.name,
          Department: encounterData?.department?.name,
          Location: getFullLocationName(encounterData?.location),
          'Requested by': requestedBy?.displayName,
          'Sample time': sampleTime ? <DateDisplay date={sampleTime} showTime /> : null,
          Priority: priority?.name,
          'Test category': category?.name,
          'Test type': tests.map(test => test.labTestType?.name).join(', '),
        }}
      />
    );
  },
);
