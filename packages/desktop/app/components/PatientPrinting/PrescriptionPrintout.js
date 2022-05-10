import React, { useEffect, useState } from 'react';
import moment from 'moment';

import { useApi } from '../../api';
import { SimplePrintout } from './SimplePrintout';

export const PrescriptionPrintout = React.memo(
  ({ prescriptionData, patientData, certificateData }) => {
    const api = useApi();

    const { date } = prescriptionData;

    return (
      <SimplePrintout
        patientData={patientData}
        certificateData={{ ...certificateData, pageTitle: 'Prescription' }}
        tableData={{
          Date: date ? moment(date).format('DD/MM/YYYY') : null,
          Prescriber: '',
          'Prescriber ID': '',
          Facility: '',
          Medication: '',
          Dose: '',
          Instructions: '',
          Quantity: '',
          Repeats: '',
        }}
      />
    );
  },
);
