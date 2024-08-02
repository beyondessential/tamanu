import React from 'react';
import { ImportExportView } from './components/ImportExportView';

export const InsurerPaymentsAdminView = () => (
  <ImportExportView
    title="Insurer Payments"
    endpoint="insurerPayments"
    disableExport
  />
);
