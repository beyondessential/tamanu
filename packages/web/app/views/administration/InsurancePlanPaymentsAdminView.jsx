import React from 'react';
import { ImportExportView } from './components/ImportExportView';

export const InsurancePlanPaymentsAdminView = () => (
  <ImportExportView
    title="Insurance Plan Payments"
    endpoint="insurancePlanPayments"
    // no export required for insurance plan payments
    buildTabs={(importTab) => [importTab]}
    data-testid="importexportview-n1ke"
  />
);
