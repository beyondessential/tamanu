import React from 'react';
import { Box } from '@material-ui/core';
import { PatientPaymentsPane } from './PatientPaymentsPane';
import { InsurerPaymentsTable } from './InsurerPaymentsTable';

export const PaymentTablesGroup = ({ invoice }) => {
  return (
    <Box sx={{ flex: 2 }}>
      <PatientPaymentsPane invoice={invoice} />
      <InsurerPaymentsTable />
    </Box>
  );
};
