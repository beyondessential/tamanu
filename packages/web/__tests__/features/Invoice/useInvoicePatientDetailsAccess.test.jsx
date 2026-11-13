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
      expect(access({}).canAddInsurancePlanToInvoice).toBe(true);
    });

    it.each([INVOICE_STATUSES.FINALISED, INVOICE_STATUSES.CANCELLED])(
      'is not offered on a %s invoice, which can take no further plan',
      status => {
        expect(access({ status }).canAddInsurancePlanToInvoice).toBe(false);
      },
    );

    it('is not offered to a user who cannot edit invoices', () => {
      expect(access({ can: ['write:Patient'] }).canAddInsurancePlanToInvoice).toBe(false);
    });

    // Choosing which of the patient's plans apply is an invoice-only act, so a user who can edit
    // invoices keeps the button even without permission to edit patient records.
    it('is offered to a user who can edit invoices but not patient records', () => {
      expect(access({ can: ['write:Invoice', 'read:Patient'] }).canAddInsurancePlanToInvoice).toBe(true);
    });

    it('is not offered where the deployment hides the insurance plan field', () => {
      expect(access({ hidden: true }).canAddInsurancePlanToInvoice).toBe(false);
    });
  });

  describe('recording a plan on the patient', () => {
    it('is allowed to a user who can edit both invoices and patient records', () => {
      expect(access({}).canRecordPlanOnPatient).toBe(true);
    });

    // This leg writes to the patient, so it is the one that needs patient-edit permission.
    it('is not allowed to a user who cannot edit patient records', () => {
      expect(access({ can: ['write:Invoice', 'read:Patient'] }).canRecordPlanOnPatient).toBe(false);
    });

    it('is not allowed to a user who cannot edit invoices', () => {
      expect(access({ can: ['write:Patient'] }).canRecordPlanOnPatient).toBe(false);
    });

    it.each([INVOICE_STATUSES.FINALISED, INVOICE_STATUSES.CANCELLED])(
      'is not allowed on a %s invoice',
      status => {
        expect(access({ status }).canRecordPlanOnPatient).toBe(false);
      },
    );
  });

  describe('editing the invoice', () => {
    // The menu reads this from here rather than deriving it again, so the two cannot disagree.
    it('is allowed to a user with write permission on invoices', () => {
      expect(access({}).canWriteInvoice).toBe(true);
    });

    it('is not allowed to a user without it', () => {
      expect(access({ can: ['read:Patient'] }).canWriteInvoice).toBe(false);
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
