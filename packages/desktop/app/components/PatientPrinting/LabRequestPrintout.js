import React from 'react';
import moment from 'moment';

import { SimplePrintout } from './SimplePrintout';
import { LoadingIndicator } from '../LoadingIndicator';

export const LabRequestPrintout = React.memo(
  ({ labRequestData, patientData, encounterData, certificateData, isLoading }) => {
    const {
      displayId,
      requestedDate,
      sampleTime,
      laboratory,
      requestedBy,
      priority,
      category,
      tests,
      notes,
    } = labRequestData;

    if (isLoading) {
      return <LoadingIndicator />;
    }

    return (
      <SimplePrintout
        patientData={patientData}
        notes={notes}
        certificateData={{ ...certificateData, pageTitle: 'Lab Request' }}
        tableData={{
          'Request number': displayId,
          'Request date': requestedDate ? moment(requestedDate).format('DD/MM/YYYY') : null,
          Facility: laboratory?.name,
          Department: encounterData?.department?.name,
          'Requested by': requestedBy?.displayName,
          'Sample time': sampleTime ? moment(sampleTime).format('DD/MM/YYYY hh:mm a') : null,
          Priority: priority?.name,
          'Test type': category?.name,
          'Test requested': tests.map(test => test.labTestType?.name).join(', '),
        }}
      />
    );
  },
);
