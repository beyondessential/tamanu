import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { INVOICE_STATUSES } from '@tamanu/constants';

let permissions = [];
let settings = {};

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({
    ability: { can: (verb, subject) => permissions.includes(`${verb}:${subject}`) },
  }),
}));

vi.mock('../../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: key => settings[key] }),
}));

const { useInvoicePatientDetailsAccess } = await import(
  '../../../app/features/Invoice/useInvoicePatientDetailsAccess'
);

const ALL_PERMISSIONS = ['write:Invoice', 'write:Patient', 'read:Patient', 'create:Patient'];

const access = ({ status = INVOICE_STATUSES.IN_PROGRESS, can = ALL_PERMISSIONS, hidden = false }) => {
  permissions = can;
  settings = { 'fields.invoiceInsurancePlanId.hidden': hidden };
  return renderHook(() => useInvoicePatientDetailsAccess({ status })).result.current;
};

describe('useInvoicePatientDetailsAccess', () => {
  describe('viewing the patient details', () => {
    it('offers them to a user who can only read patient records', () => {
      expect(access({ can: ['read:Patient'] }).canViewPatientDetails).toBe(true);
    });

    it('withholds them from a user with no patient permission at all', () => {
      expect(access({ can: ['write:Invoice'] }).canViewPatientDetails).toBe(false);
    });
  });

  describe('editing the patient details', () => {
    it('allows editing on an in-progress invoice', () => {
      expect(access({}).isPatientDetailsEditable).toBe(true);
    });

    // A settled invoice is a billing record, so the details it was billed against are shown as
    // they stand rather than opened for editing.
    it.each([INVOICE_STATUSES.FINALISED, INVOICE_STATUSES.CANCELLED])(
      'shows them read-only on a %s invoice',
      status => {
        expect(access({ status }).isPatientDetailsEditable).toBe(false);
      },
    );

    it('shows them read-only to a user who cannot edit patient records', () => {
      expect(access({ can: ['read:Patient', 'write:Invoice'] }).isPatientDetailsEditable).toBe(
        false,
      );
    });
  });

  describe('adding an insurance plan', () => {
    it('is offered on an in-progress invoice to a user who can edit invoices and patients', () => {
      expect(access({}).canAddPlanToPatient).toBe(true);
    });

    it.each([INVOICE_STATUSES.FINALISED, INVOICE_STATUSES.CANCELLED])(
      'is not offered on a %s invoice, which can take no further plan',
      status => {
        expect(access({ status }).canAddPlanToPatient).toBe(false);
      },
    );

    it('is not offered to a user who cannot edit invoices', () => {
      expect(access({ can: ['write:Patient'] }).canAddPlanToPatient).toBe(false);
    });

    // The route exists to record a plan on the patient, which a read-only form cannot do.
    it('is not offered to a user who cannot edit patient records', () => {
      expect(access({ can: ['write:Invoice', 'read:Patient'] }).canAddPlanToPatient).toBe(false);
    });

    it('is not offered where the deployment hides the insurance plan field', () => {
      expect(access({ hidden: true }).canAddPlanToPatient).toBe(false);
    });
  });

  describe('the insurance plan field', () => {
    it('counts as shown when the deployment has not hidden it', () => {
      expect(access({}).isInsurancePlanFieldShown).toBe(true);
    });

    it('counts as hidden when the deployment has hidden it', () => {
      expect(access({ hidden: true }).isInsurancePlanFieldShown).toBe(false);
    });
  });
});
