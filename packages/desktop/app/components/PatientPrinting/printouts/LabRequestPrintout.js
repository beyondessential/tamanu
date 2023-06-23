import React from 'react';

import { SimplePrintout } from './reusable/SimplePrintout';
import { DateDisplay } from '../../DateDisplay';
import { getFullLocationName } from '../../../utils/location';

export const LabRequestPrintout = React.memo(
  ({ labRequest, patient, village, additionalData, encounter, certificate }) => {
    const {
      displayId,
      requestedDate,
      sampleTime,
      requestedBy,
      priority,
      category,
      tests,
      notes,
    } = labRequest;

    return (
      <SimplePrintout
        patient={patient}
        village={village}
        additionalData={additionalData}
        notes={notes}
        certificate={{ ...certificate, pageTitle: 'Lab Request' }}
        tableData={{
          'Test ID': displayId,
          'Request date': requestedDate ? <DateDisplay date={requestedDate} showTime /> : null,
          Facility: encounter?.location?.facility?.name,
          Department: encounter?.department?.name,
          Location: getFullLocationName(encounter?.location),
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
