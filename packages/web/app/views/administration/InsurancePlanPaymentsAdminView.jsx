import React from 'react';
import { ImportExportView } from './components/ImportExportView';

/** @privateRemarks No export required for insurance plan payments */
const buildTabs = importTab => [importTab];

export const InsurancePlanPaymentsAdminView = () => (
  <ImportExportView
    title="Insurance Plan Payments"
    endpoint="insurancePlanPayments"
    buildTabs={buildTabs}
    data-testid="importexportview-n1ke"
  />
);
