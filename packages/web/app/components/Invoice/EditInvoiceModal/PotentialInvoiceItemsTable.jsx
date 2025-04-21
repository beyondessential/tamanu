import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { differenceBy } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { INVOICE_ITEMS_CATEGORY_LABELS } from '@tamanu/constants';
import { toDateString } from '@tamanu/utils/dateTime';
import { formatDisplayPrice } from '@tamanu/shared/utils/invoice';
import { DataFetchingTable } from '../../Table';
import { TranslatedEnum, TranslatedText } from '../../Translation';
import { DateDisplay } from '../../DateDisplay';
import { Button } from '../../Button';
import { Colors, denseTableStyle } from '../../../constants';
import { useTableSorting } from '../../Table/useTableSorting';

const StyledDataFetchingTable = styled(DataFetchingTable)`
  max-height: 400px;
`;

const SingleAddButton = styled(Button)`
  min-width: 56px;
`;

const PaneHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  padding-right: 5px;
  padding-top: 8px;
  padding-bottom: 8px;
  background: white;
  border-bottom: 1px solid ${Colors.outline};
`;

const BulkAddButton = styled(Button)`
  min-width: 74px;
`;

const Container = styled.div`
  width: 70%;
  display: grid;
  margin-left: -4px;
  overflow: auto;
  padding-left: 15px;
  padding-right: 15px;
  background: white;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};

  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: white;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${Colors.softText};
    border-radius: 5px;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: ${Colors.softText};
  }
`;

export const PotentialInvoiceItemsTable = ({ invoice, invoiceItems, formArrayMethods }) => {
  const [potentialInvoiceItems, setPotentialInvoiceItems] = useState([]);
  const { orderBy, order, onChangeOrderBy, customSort } = useTableSorting({
    initialSortKey: '',
    initialSortDirection: 'asc',
  });

  const customSortWrapper = customSort => data => {
    const potentialInvoiceItems = data.map(item => ({
      ...item,
      productPrice: Number(item.productPrice),
    }));
    return customSort(potentialInvoiceItems);
  };

  const wrappedCustomSort = customSortWrapper(customSort);

  const isInvoiceItemsEmpty =
    invoiceItems.length === 1 &&
    !invoiceItems[0].orderDate &&
    !invoiceItems[0].productId &&
    !invoiceItems[0].orderedByUserId;

  const onPotentialInvoiceItemsFetched = useCallback(data => {
    setPotentialInvoiceItems(data?.data || []);
  }, []);

  const potentialInvoiceItemRowStyle = ({ sourceId }) => {
    const idList = invoiceItems.map(row => row?.sourceId).filter(Boolean);
    if (idList.includes(sourceId)) return 'display: none;';
    return '';
  };

  const handleAddPotentialInvoiceItems = items => {
    if (isInvoiceItemsEmpty) formArrayMethods.remove(0);
    items.forEach(
      item =>
        !potentialInvoiceItemRowStyle(item) &&
        formArrayMethods.push({
          ...item,
          id: uuidv4(),
          orderDate: toDateString(item.orderDate),
          quantity: 1,
        }),
    );
  };

  const isEmptyPotentialInvoiceItems = !differenceBy(
    potentialInvoiceItems,
    invoiceItems,
    it => it.sourceId || it.id,
  ).length;

  const POTENTIAL_INVOICE_ITEMS_TABLE_COLUMNS = [
    {
      key: 'orderDate',
      title: <TranslatedText stringId="general.date.label" fallback="Date" />,
      accessor: ({ orderDate }) => <DateDisplay date={orderDate} />,
    },
    {
      key: 'productCode',
      title: <TranslatedText stringId="invoice.table.column.code" fallback="Code" />,
      accessor: ({ productCode }) => productCode,
    },
    {
      key: 'productType',
      title: <TranslatedText stringId="invoice.table.column.category" fallback="Category" />,
      accessor: ({ productType }) => (
        <TranslatedEnum value={productType} enumValues={INVOICE_ITEMS_CATEGORY_LABELS} />
      ),
    },
    {
      key: 'productPrice',
      title: <TranslatedText stringId="invoice.table.column.price" fallback="Price" />,
      accessor: ({ productPrice }) => `$${formatDisplayPrice(productPrice)}`,
    },
    {
      key: '',
      sortable: false,
      numeric: true, // Right aligns the cell content
      accessor: row => (
        <SingleAddButton variant="outlined" onClick={() => handleAddPotentialInvoiceItems([row])}>
          <TranslatedText stringId="general.action.add" fallback="Add" />
        </SingleAddButton>
      ),
    },
  ];

  return (
    <Container>
      <PaneHeader>
        <TranslatedText
          stringId="invoice.modal.potentialItems.title"
          fallback="Patient items to be added"
        />
        {!isEmptyPotentialInvoiceItems && (
          <BulkAddButton onClick={() => handleAddPotentialInvoiceItems(potentialInvoiceItems)}>
            <TranslatedText stringId="general.action.addAll" fallback="Add all" />
          </BulkAddButton>
        )}
      </PaneHeader>
      <StyledDataFetchingTable
        endpoint={`invoices/${invoice.id}/potentialInvoiceItems`}
        columns={POTENTIAL_INVOICE_ITEMS_TABLE_COLUMNS}
        noDataMessage={
          <TranslatedText
            stringId="invoice.modal.potentialInvoices.table.noData"
            fallback="No patient items to be added"
          />
        }
        allowExport={false}
        rowStyle={potentialInvoiceItemRowStyle}
        onDataFetched={onPotentialInvoiceItemsFetched}
        headerColor={Colors.white}
        fetchOptions={{ page: undefined }}
        elevated={false}
        isEmpty={isEmptyPotentialInvoiceItems}
        containerStyle={denseTableStyle.container}
        cellStyle={denseTableStyle.cell}
        headStyle={denseTableStyle.head}
        statusCellStyle={denseTableStyle.statusCell}
        disablePagination
        orderBy={orderBy}
        order={order}
        onChangeOrderBy={onChangeOrderBy}
        customSort={wrappedCustomSort}
        rowIdKey="sourceId"
      />
    </Container>
  );
};
