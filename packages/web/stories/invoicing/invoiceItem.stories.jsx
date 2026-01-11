import React from 'react';
import styled from 'styled-components';
import { Formik } from 'formik';
import { InvoiceItemRow } from '../app/features/Invoice/InvoiceForm/InvoiceItem';
import { InvoiceItemHeader } from '../app/features/Invoice/InvoiceForm/InvoiceItemHeader';
import { Colors } from '../app/constants';

const ItemContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  background: white;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
`;

// Dummy invoice items
const DUMMY_ITEM_EDITABLE = {
  id: 'item-new',
  quantity: 1,
  orderDate: '2024-03-15',
};

const DUMMY_ITEM_WITH_PRODUCT = {
  id: 'item-001',
  productId: 'product-001',
  quantity: 1,
  orderDate: '2024-03-15',
  orderedByUserId: 'user-001',
  product: {
    id: 'product-001',
    name: 'Blood Test - Complete Blood Count',
    code: 'LAB-001',
    invoicePriceListItem: {
      price: 75.0,
    },
  },
  orderedByUser: {
    displayName: 'Dr. Smith',
  },
};

const DUMMY_ITEM_WITH_INSURANCE = {
  id: 'item-002',
  productId: 'product-002',
  quantity: 1,
  orderDate: '2024-03-15',
  orderedByUserId: 'user-002',
  product: {
    id: 'product-002',
    name: 'X-Ray - Chest',
    code: 'RAD-001',
    invoicePriceListItem: {
      price: 150.0,
    },
  },
  orderedByUser: {
    displayName: 'Dr. Johnson',
  },
  insurancePlanItems: [
    {
      id: 'ins-item-001',
      insurerName: 'Health Insurance Co.',
      coveragePercentage: 80,
    },
  ],
};

const DUMMY_ITEM_MEDICATION = {
  id: 'item-003',
  productId: 'product-003',
  quantity: 20,
  orderDate: '2024-03-15',
  orderedByUserId: 'user-003',
  product: {
    id: 'product-003',
    name: 'Medication - Amoxicillin 500mg',
    code: 'MED-001',
    invoicePriceListItem: {
      price: 2.5,
    },
  },
  orderedByUser: {
    displayName: 'Pharmacist Brown',
  },
};

const DUMMY_ITEM_MANUAL_PRICE = {
  id: 'item-004',
  productId: 'product-004',
  quantity: 1,
  orderDate: '2024-03-15',
  orderedByUserId: 'user-001',
  manualEntryPrice: 125.0,
  product: {
    id: 'product-004',
    name: 'Consultation - Specialist',
    code: 'CONS-002',
  },
  orderedByUser: {
    displayName: 'Dr. Smith',
  },
};

// Mock form array methods
const mockFormArrayMethods = {
  push: item => console.log('Push item:', item),
  remove: index => console.log('Remove item at index:', index),
  replace: (index, item) => console.log('Replace item at index:', index, 'with:', item),
};

// Formik wrapper for InvoiceItem stories
const FormikWrapper = ({ children, initialValues }) => (
  <Formik initialValues={initialValues} onSubmit={values => console.log('Form submitted:', values)}>
    {() => children}
  </Formik>
);

const InvoiceItemTemplate = args => {
  const initialValues = {
    invoiceItems: [args.item],
  };

  return (
    <FormikWrapper initialValues={initialValues}>
      <ItemContainer>
        <InvoiceItemHeader />
        <InvoiceItemRow
          index={0}
          item={args.item}
          isDeleteDisabled={args.isDeleteDisabled}
          showActionMenu={args.showActionMenu}
          formArrayMethods={mockFormArrayMethods}
          invoiceIsEditable={args.invoiceIsEditable}
          encounterId={args.encounterId || 'encounter-001'}
          priceListId={args.priceListId || 'pricelist-001'}
          isEditing={args.isEditing}
        />
      </ItemContainer>
    </FormikWrapper>
  );
};

export const EditableItem = InvoiceItemTemplate.bind({});
EditableItem.args = {
  item: DUMMY_ITEM_EDITABLE,
  isDeleteDisabled: false,
  showActionMenu: true,
  invoiceIsEditable: true,
  isEditing: false,
};
EditableItem.storyName = 'Invoice Item - Editable (New)';

export const ItemWithProduct = InvoiceItemTemplate.bind({});
ItemWithProduct.args = {
  item: DUMMY_ITEM_WITH_PRODUCT,
  isDeleteDisabled: false,
  showActionMenu: true,
  invoiceIsEditable: true,
  isEditing: false,
};
ItemWithProduct.storyName = 'Invoice Item - With Product';

export const ItemWithInsurance = InvoiceItemTemplate.bind({});
ItemWithInsurance.args = {
  item: DUMMY_ITEM_WITH_INSURANCE,
  isDeleteDisabled: false,
  showActionMenu: true,
  invoiceIsEditable: true,
  isEditing: false,
};
ItemWithInsurance.storyName = 'Invoice Item - With Insurance';

export const ItemMedication = InvoiceItemTemplate.bind({});
ItemMedication.args = {
  item: DUMMY_ITEM_MEDICATION,
  isDeleteDisabled: false,
  showActionMenu: true,
  invoiceIsEditable: true,
  isEditing: false,
};
ItemMedication.storyName = 'Invoice Item - Medication (High Quantity)';

export const ItemManualPrice = InvoiceItemTemplate.bind({});
ItemManualPrice.args = {
  item: DUMMY_ITEM_MANUAL_PRICE,
  isDeleteDisabled: false,
  showActionMenu: true,
  invoiceIsEditable: true,
  isEditing: false,
};
ItemManualPrice.storyName = 'Invoice Item - Manual Price Entry';

export const ItemReadOnly = InvoiceItemTemplate.bind({});
ItemReadOnly.args = {
  item: DUMMY_ITEM_WITH_PRODUCT,
  isDeleteDisabled: true,
  showActionMenu: false,
  invoiceIsEditable: false,
  isEditing: false,
};
ItemReadOnly.storyName = 'Invoice Item - Read Only';

export const ItemEditing = InvoiceItemTemplate.bind({});
ItemEditing.args = {
  item: DUMMY_ITEM_WITH_PRODUCT,
  isDeleteDisabled: false,
  showActionMenu: true,
  invoiceIsEditable: true,
  isEditing: true,
};
ItemEditing.storyName = 'Invoice Item - Editing Mode';
