import React from 'react';
import { ImportExportView } from './components/ImportExportView';

export const InsurerPaymentsAdminView = () => (
  <ImportExportView
    title="Insurer Payments"
    endpoint="insurerPayments"
    buildTabs={importTab => [importTab]} // no export required for insurer payments
  />
);
