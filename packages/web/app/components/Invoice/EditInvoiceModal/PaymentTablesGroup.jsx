import React from 'react';
import { Box } from '@material-ui/core';
import { PatientPaymentsTable } from './PatientPaymentsTable';
import { InsurerPaymentsTable } from './InsurerPaymentsTable';

export const PaymentTablesGroup = ({ invoice }) => {
  return (
    <Box sx={{ flex: 2 }}>
      <PatientPaymentsTable invoice={invoice} />
      <InsurerPaymentsTable invoice={invoice} />
    </Box>
  );
};
