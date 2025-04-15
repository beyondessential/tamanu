import React from 'react';
import { ImportExportView } from './components/ImportExportView';

export const InsurerPaymentsAdminView = () => (
  <ImportExportView
    title="Insurer Payments"
    endpoint="insurerPayments"
    // no export required for insurer payments
    buildTabs={(importTab) => [importTab]}
    data-testid="importexportview-n1ke"
  />
);
