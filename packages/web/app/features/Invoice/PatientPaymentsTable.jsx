import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import Decimal from 'decimal.js';

import { INVOICE_STATUSES } from '@tamanu/constants';
import { getInvoiceSummary, round } from '@tamanu/utils/invoice';
import { Button } from '@tamanu/ui-components';

import { TranslatedText } from '../../components/Translation';
import { Table } from '../../components/Table';
import { Colors, denseTableStyle } from '../../constants';
import { Heading4 } from '../../components/Typography';
import { DateDisplay } from '../../components/DateDisplay';
import { useAuth } from '../../contexts/Auth';
import { PatientPaymentModal } from './PatientPaymentModal';
import { NoteModalActionBlocker } from '../../components';
import { ThreeDotMenu } from '../../components/ThreeDotMenu';
import { Price } from './Price';
import { PatientPaymentRefundModal } from './PatientPaymentRefundModal';
import { NoInsurancePlanModal } from './NoInsurancePlanModal';
import { INSURANCE_PLAN_ENTRY, InsurancePlanFlow } from './InsurancePlanFlow';
import { useInvoicePatientDetailsAccess } from './useInvoicePatientDetailsAccess';

const TableContainer = styled.div`
  padding-left: 16px;
  padding-right: 16px;
  background-color: ${Colors.white};
  border-radius: 4px;
  border: 1px solid ${Colors.outline};

  table {
    table-layout: fixed;

    .MuiTableCell-root {
      padding: 12px 0;
    }

    tr:last-child td {
      border: none;
    }

    th {
      // table-layout is fixed, so these widths are the whole story: whatever they do not claim is
      // all the method column gets. Date and receipt number are sized to their content with room
      // to spare, leaving the method heading enough not to collide with the next column.
      &:nth-child(1) {
        width: 80px;
      }

      &:nth-child(2) {
        // intentionally empty to take up remaining space (method column)
      }

      &:nth-child(3) {
        width: 80px;
      }

      &:nth-child(4) {
        width: 80px;
      }

      &:nth-child(5) {
        width: 50px;
      }

      &:nth-child(6) {
        width: 30px;
      }
    }
  }
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${Colors.outline};

  h4 {
    margin: 15px 0;
  }
`;

const Value = styled.span`
  ${props =>
    props.$strikethrough &&
    css`
      text-decoration-line: line-through;
    `}
`;

export const PatientPaymentsTable = ({ invoice }) => {
  const [patientPaymentRefundModalIsOpen, setPatientPaymentRefundModalIsOpen] = useState(false);
  const [paymentModalIsOpen, setPaymentModalIsOpen] = useState(false);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState(null);
  const [isConfirmingNoInsurancePlan, setIsConfirmingNoInsurancePlan] = useState(false);
  const [isAddingInsurancePlan, setIsAddingInsurancePlan] = useState(false);

  const { canAddPlanToPatient, isInsurancePlanFieldShown } =
    useInvoicePatientDetailsAccess(invoice);

  const patientPayments = invoice.payments.filter(payment => !!payment?.patientPayment);

  const { patientPaymentRemainingBalance } = getInvoiceSummary(invoice);

  const { ability } = useAuth();
  const canCreatePayment = ability.can('create', 'InvoicePayment');
  const canEditPayment = ability.can('write', 'InvoicePayment');

  const hideRecordPaymentForm =
    !canCreatePayment ||
    round(new Decimal(patientPaymentRemainingBalance).toNumber(), 2) <= 0 ||
    invoice.status === INVOICE_STATUSES.CANCELLED;

  const onEditPaymentRecord = row => {
    setSelectedPaymentRecord(row);
    setPaymentModalIsOpen(true);
  };

  const onRefundPaymentRecord = row => {
    setSelectedPaymentRecord(row);
    setPatientPaymentRefundModalIsOpen(true);
  };

  const onClosePatientPaymentRefundModal = () => {
    setSelectedPaymentRecord(null);
    setPatientPaymentRefundModalIsOpen(false);
  };

  const openPaymentForm = () => {
    setIsConfirmingNoInsurancePlan(false);
    setIsAddingInsurancePlan(false);
    setSelectedPaymentRecord(null);
    setPaymentModalIsOpen(true);
  };

  // What the patient owes depends on the invoice's plans, so recording a payment against an invoice
  // that has none is checked first. A deployment that does not record insurance plans at all has
  // nothing to check.
  const onRecordPayment = () => {
    if (isInsurancePlanFieldShown && (invoice.insurancePlans?.length ?? 0) === 0) {
      setIsConfirmingNoInsurancePlan(true);
      return;
    }
    openPaymentForm();
  };

  const onAddInsurancePlan = () => {
    setIsConfirmingNoInsurancePlan(false);
    setIsAddingInsurancePlan(true);
  };

  const onCloseInsurancePlanFlow = () => {
    setIsConfirmingNoInsurancePlan(false);
    setIsAddingInsurancePlan(false);
  };

  // Only a plan that was actually applied changes what is due, so only then does the payment form
  // follow; leaving the picker with nothing selected ends the flow at the invoice.
  const onInsurancePlansApplied = appliedPlans => {
    if (appliedPlans.length > 0) {
      openPaymentForm();
      return;
    }
    onCloseInsurancePlanFlow();
  };

  const onClosePaymentModal = () => {
    setSelectedPaymentRecord(null);
    setPaymentModalIsOpen(false);
  };

  const COLUMNS = [
    {
      key: 'date',
      title: (
        <TranslatedText
          stringId="general.date.label"
          fallback="Date"
          data-testid="translatedtext-5qcp"
        />
      ),
      sortable: false,
      accessor: ({ date, refundPayment }) => (
        <Value $strikethrough={Boolean(refundPayment)}>
          <DateDisplay date={date} shortYear data-testid="datedisplay-21cc" />
        </Value>
      ),
    },
    {
      key: 'methodName',
      title: (
        <TranslatedText
          stringId="invoice.table.payment.column.method"
          fallback="Method"
          data-testid="translatedtext-55c8"
        />
      ),
      sortable: false,
      accessor: ({ patientPayment, refundPayment }) => (
        <Value $strikethrough={Boolean(refundPayment)}>{patientPayment?.method?.name}</Value>
      ),
    },
    {
      key: 'amount',
      title: (
        <TranslatedText
          stringId="invoice.table.payment.column.amount"
          fallback="Amount"
          data-testid="translatedtext-9pxt"
        />
      ),
      sortable: false,
      accessor: ({ amount, refundPayment }) => (
        <Value $strikethrough={Boolean(refundPayment)}>
          <Price price={amount} />
        </Value>
      ),
    },
    {
      key: 'receiptNumber',
      title: (
        <TranslatedText
          stringId="invoice.table.payment.column.receiptNo"
          fallback="Receipt no."
          data-testid="translatedtext-v87s"
        />
      ),
      sortable: false,
      accessor: ({ receiptNumber, refundPayment }) => (
        <Value $strikethrough={Boolean(refundPayment)}>{receiptNumber}</Value>
      ),
    },
    {
      key: 'status',
      title: <TranslatedText stringId="invoice.table.payment.column.status" fallback="Status" />,
      accessor: ({ refundPayment }) =>
        refundPayment ? (
          <TranslatedText stringId="invoice.paymentStatus.refunded" fallback="Refunded" />
        ) : (
          <TranslatedText stringId="invoice.paymentStatus.paid" fallback="Paid" />
        ),
      sortable: false,
    },
    {
      key: '',
      sortable: false,
      accessor: row =>
        !canEditPayment || Boolean(row.refundPayment) ? null : (
          <NoteModalActionBlocker>
            <ThreeDotMenu
              items={[
                {
                  label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
                  onClick: () => onEditPaymentRecord(row),
                },
                {
                  label: <TranslatedText stringId="general.action.refund" fallback="Refund" />,
                  onClick: () => onRefundPaymentRecord(row),
                },
              ]}
              data-testid="invoice-payment-menu-c4w2"
            />
          </NoteModalActionBlocker>
        ),
    },
  ];

  return (
    <>
      <TableContainer>
        <Title>
          <Heading4>
            <TranslatedText
              stringId="invoice.modal.payment.patientPayments"
              fallback="Patient payments"
            />
          </Heading4>
          {!hideRecordPaymentForm && (
            <NoteModalActionBlocker>
              <Button size="small" data-testid="button-dre1" onClick={onRecordPayment}>
                <TranslatedText
                  stringId="invoice.modal.payment.action.recordPayment"
                  fallback="Record payment"
                />
              </Button>
            </NoteModalActionBlocker>
          )}
        </Title>
        <Table
          columns={COLUMNS}
          allowExport={false}
          headerColor={Colors.white}
          fetchOptions={{ page: undefined }}
          elevated={false}
          containerStyle={denseTableStyle.container}
          cellStyle={denseTableStyle.cell}
          headStyle={denseTableStyle.head}
          statusCellStyle={denseTableStyle.statusCell}
          disablePagination={true}
          noDataMessage={'No patient payments to display'}
          rowIdKey={'id'}
          data={patientPayments}
          data-testid="table-so8f"
        />
      </TableContainer>
      <PatientPaymentModal
        invoice={invoice}
        key={paymentModalIsOpen ? 'open' : 'closed'}
        patientPaymentRemainingBalance={patientPaymentRemainingBalance}
        selectedPaymentRecord={selectedPaymentRecord}
        isOpen={paymentModalIsOpen}
        onClose={onClosePaymentModal}
      />
      <PatientPaymentRefundModal
        invoice={invoice}
        key={patientPaymentRefundModalIsOpen ? 'open' : 'closed'}
        selectedPaymentRecord={selectedPaymentRecord}
        isOpen={patientPaymentRefundModalIsOpen}
        onClose={onClosePatientPaymentRefundModal}
      />
      <NoInsurancePlanModal
        open={isConfirmingNoInsurancePlan}
        onClose={() => setIsConfirmingNoInsurancePlan(false)}
        onAddInsurancePlan={canAddPlanToPatient ? onAddInsurancePlan : undefined}
        onContinue={openPaymentForm}
      />
      <InsurancePlanFlow
        invoice={invoice}
        open={isAddingInsurancePlan}
        entry={INSURANCE_PLAN_ENTRY.AUTO}
        onClose={onCloseInsurancePlanFlow}
        onApplied={onInsurancePlansApplied}
      />
    </>
  );
};
