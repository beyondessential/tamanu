import React from 'react';
import { ImporterView } from './components/ImporterView';
import { REFERENCE_TYPE_VALUES } from 'shared/constants';

const ALLOWLIST = [
  ...REFERENCE_TYPE_VALUES,
  'user',
  'patient',
  'facility',
  'department',
  'location',
  'certifiableVaccine',
  'scheduledVaccine',
  'administeredVaccine',
  'labTestType',
  'invoicePriceChangeType',
  'invoiceLineType',
  'role',
  'permission',
];

ALLOWLIST.sort();

export const ReferenceDataAdminView = () => (
  <ImporterView
    title="Import reference data"
    endpoint="admin/importRefData"
    whitelist={ALLOWLIST}
  />
);
