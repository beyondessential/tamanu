import React from 'react';
import { Box } from '@mui/material';
import { PatientPaymentsTable } from './PatientPaymentsTable';
import { InsurerPaymentsTable } from './InsurerPaymentsTable';

export const PaymentTablesGroup = ({ invoice }) => {
  return (
    <Box sx={{ flex: 2 }} data-testid="box-pnra">
      <PatientPaymentsTable invoice={invoice} data-testid="patientpaymentstable-xkl4" />
      <InsurerPaymentsTable invoice={invoice} data-testid="insurerpaymentstable-27fr" />
    </Box>
  );
};
