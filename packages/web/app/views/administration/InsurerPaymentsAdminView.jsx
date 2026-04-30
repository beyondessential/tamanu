import React from 'react';
import { ImportExportView } from './components/ImportExportView';

/** @privateRemarks No export required for insurer payments */
const buildTabs = importTab => [importTab];

export const InsurerPaymentsAdminView = () => (
  <ImportExportView
    title="Insurer Payments"
    endpoint="insurerPayments"
    buildTabs={buildTabs}
    data-testid="importexportview-n1ke"
  />
);
