import React, { useCallback, useState } from 'react';
import { getInvoiceSummaryDisplay } from '@tamanu/shared/utils/invoice';
import { Box } from '@material-ui/core';
import { PatientPaymentsTable } from './PatientPaymentsTable';
import { InsurerPaymentsTable } from './InsurerPaymentsTable';

export const PaymentTablesGroup = ({ invoice }) => {
  const { patientTotal } = getInvoiceSummaryDisplay(invoice);
  const [patientRemainingBalance, setPatientRemainingBalance] = useState(0);

  const onPatientPaymentsFetched = useCallback(({ data }) => {
    const totalPatientPayment = data.reduce((acc, { amount }) => acc + Number(amount), 0);
    const patientRemainingBalance = patientTotal - totalPatientPayment;
    setPatientRemainingBalance(patientRemainingBalance);
  }, []);

  return (
    <Box sx={{ flex: 2 }}>
      <PatientPaymentsTable
        remainingBalance={patientRemainingBalance}
        onDataFetched={onPatientPaymentsFetched}
        invoiceId={invoice.id}
      />
      <InsurerPaymentsTable />
    </Box>
  );
};
