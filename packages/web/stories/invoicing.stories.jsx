import React from 'react';
import styled from 'styled-components';
import { InvoiceForm } from '../app/features/Invoice/InvoiceForm/InvoiceForm';
import { Colors } from '../app/constants';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  background: white;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
`;

// Dummy data
const DUMMY_INVOICE_EMPTY = {
  id: 'invoice-001',
  invoiceNumber: 'INV-2024-001',
  encounterId: 'encounter-001',
  status: 'draft',
  priceList: {
    id: 'pricelist-001',
    name: 'Standard Price List',
  },
  items: [],
  insurers: [],
  total: 0,
  patientBillingTypeId: 'billing-type-001',
};

const DUMMY_INVOICE_SINGLE_ITEM = {
  id: 'invoice-002',
  invoiceNumber: 'INV-2024-002',
  encounterId: 'encounter-002',
  status: 'draft',
  priceList: {
    id: 'pricelist-001',
    name: 'Standard Price List',
  },
  items: [
    {
      id: 'item-001',
      productId: 'product-001',
      productName: 'Blood Test - Complete Blood Count',
      quantity: 1,
      unitPrice: 75.0,
      totalPrice: 75.0,
      orderDate: '2024-03-15',
      orderedByUserId: 'user-001',
      orderedByUserName: 'Dr. Smith',
    },
  ],
  insurers: [
    {
      id: 'insurer-001',
      insurerId: 'ins-company-001',
      insurerName: 'Health Insurance Co.',
      percentage: 0.8,
    },
  ],
  total: 75.0,
  patientBillingTypeId: 'billing-type-001',
};

const DUMMY_INVOICE_MULTIPLE_ITEMS = {
  id: 'invoice-003',
  invoiceNumber: 'INV-2024-003',
  encounterId: 'encounter-003',
  status: 'draft',
  priceList: {
    id: 'pricelist-001',
    name: 'Standard Price List',
  },
  items: [
    {
      id: 'item-001',
      productId: 'product-001',
      productName: 'Blood Test - Complete Blood Count',
      quantity: 1,
      unitPrice: 75.0,
      totalPrice: 75.0,
      orderDate: '2024-03-15',
      orderedByUserId: 'user-001',
      orderedByUserName: 'Dr. Smith',
    },
    {
      id: 'item-002',
      productId: 'product-002',
      productName: 'X-Ray - Chest',
      quantity: 1,
      unitPrice: 150.0,
      totalPrice: 150.0,
      orderDate: '2024-03-15',
      orderedByUserId: 'user-002',
      orderedByUserName: 'Dr. Johnson',
    },
    {
      id: 'item-003',
      productId: 'product-003',
      productName: 'Consultation - General',
      quantity: 1,
      unitPrice: 100.0,
      totalPrice: 100.0,
      orderDate: '2024-03-15',
      orderedByUserId: 'user-001',
      orderedByUserName: 'Dr. Smith',
    },
    {
      id: 'item-004',
      productId: 'product-004',
      productName: 'Medication - Amoxicillin 500mg',
      quantity: 20,
      unitPrice: 2.5,
      totalPrice: 50.0,
      orderDate: '2024-03-15',
      orderedByUserId: 'user-003',
      orderedByUserName: 'Pharmacist Brown',
    },
  ],
  insurers: [
    {
      id: 'insurer-001',
      insurerId: 'ins-company-001',
      insurerName: 'Health Insurance Co.',
      percentage: 0.7,
    },
    {
      id: 'insurer-002',
      insurerId: 'ins-company-002',
      insurerName: 'Secondary Insurance',
      percentage: 0.2,
    },
  ],
  total: 375.0,
  patientBillingTypeId: 'billing-type-001',
};

const DUMMY_INVOICE_FINALISED = {
  id: 'invoice-004',
  invoiceNumber: 'INV-2024-004',
  encounterId: 'encounter-004',
  status: 'finalised',
  priceList: {
    id: 'pricelist-001',
    name: 'Standard Price List',
  },
  items: [
    {
      id: 'item-001',
      productId: 'product-001',
      productName: 'Blood Test - Complete Blood Count',
      quantity: 1,
      unitPrice: 75.0,
      totalPrice: 75.0,
      orderDate: '2024-03-10',
      orderedByUserId: 'user-001',
      orderedByUserName: 'Dr. Smith',
    },
    {
      id: 'item-002',
      productId: 'product-002',
      productName: 'X-Ray - Chest',
      quantity: 1,
      unitPrice: 150.0,
      totalPrice: 150.0,
      orderDate: '2024-03-10',
      orderedByUserId: 'user-002',
      orderedByUserName: 'Dr. Johnson',
    },
  ],
  insurers: [
    {
      id: 'insurer-001',
      insurerId: 'ins-company-001',
      insurerName: 'Health Insurance Co.',
      percentage: 0.8,
    },
  ],
  total: 225.0,
  patientBillingTypeId: 'billing-type-001',
};

export default {
  title: 'Invoice/InvoiceForm',
  component: InvoiceForm,
  decorators: [
    Story => (
      <Container>
        <Story />
      </Container>
    ),
  ],
};

const Template = args => {
  return <InvoiceForm {...args} />;
};

export const EmptyInvoice = Template.bind({});
EmptyInvoice.args = {
  invoice: DUMMY_INVOICE_EMPTY,
  canWrite: true,
};
EmptyInvoice.storyName = 'Empty Invoice (Editable)';

export const SingleItem = Template.bind({});
SingleItem.args = {
  invoice: DUMMY_INVOICE_SINGLE_ITEM,
  canWrite: true,
};
SingleItem.storyName = 'Single Item with Insurance';

export const MultipleItems = Template.bind({});
MultipleItems.args = {
  invoice: DUMMY_INVOICE_MULTIPLE_ITEMS,
  canWrite: true,
};
MultipleItems.storyName = 'Multiple Items with Multiple Insurers';

export const FinalisedInvoice = Template.bind({});
FinalisedInvoice.args = {
  invoice: DUMMY_INVOICE_FINALISED,
  canWrite: true,
};
FinalisedInvoice.storyName = 'Finalised Invoice (Read-only)';

export const NoWritePermission = Template.bind({});
NoWritePermission.args = {
  invoice: DUMMY_INVOICE_MULTIPLE_ITEMS,
  canWrite: false,
};
NoWritePermission.storyName = 'No Write Permission (Read-only)';
