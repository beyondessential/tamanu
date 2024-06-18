import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { Colors, denseTableStyle } from '../../constants';
import { DataFetchingTable } from '../Table';
import { DateDisplay } from '../DateDisplay';
import { TranslatedText } from '../Translation';
import { getInvoiceItemDiscountPrice } from '@tamanu/shared/utils/invoice';

const StyledTitleCell = ({ value }) => (
  <Box sx={{ color: Colors.midText, fontWeight: 400 }}>{value}</Box>
);

const PriceCell = styled.div`
  display: flex;
  gap: 10px;
`;

const PriceText = styled.span`
  text-decoration: ${props => (props.isCrossedOut ? 'line-through' : 'none')};
`;

const getPrice = row => {
  const price = row?.productPrice ?? row.product?.price;
  const originalPrice = parseFloat(price).toFixed(2);
  const discountPercentage = row.discount?.percentage;
  const finalPrice = getInvoiceItemDiscountPrice(price, discountPercentage);

  return (
    <PriceCell>
      <PriceText isCrossedOut={!!discountPercentage}>{originalPrice}</PriceText>
      {!!discountPercentage && <span>{finalPrice}</span>}
    </PriceCell>
  );
};

const INVOICE_LINE_COLUMNS = [
  {
    key: 'orderDate',
    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
    sortable: false,
    accessor: ({ orderDate }) => <DateDisplay date={orderDate} />,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'details',
    title: <TranslatedText stringId="invoice.table.column.details" fallback="Details" />,
    sortable: false,
    accessor: ({ productName, product }) => productName ?? product.name,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'code',
    title: <TranslatedText stringId="invoice.table.column.code" fallback="Code" />,
    sortable: false,
    accessor: ({ product }) => product?.referenceData?.code,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'orderedBy',
    title: <TranslatedText stringId="invoice.table.column.orderedBy" fallback="Ordered by" />,
    sortable: false,
    accessor: ({ orderedByUser }) => orderedByUser?.displayName,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'price',
    title: <TranslatedText stringId="invoice.table.column.price" fallback="Price" />,
    sortable: false,
    accessor: getPrice,
    TitleCellComponent: StyledTitleCell,
  },
];

export const InvoiceItemsTable = ({ invoice }) => {
  return (
    <DataFetchingTable
      endpoint={`invoices/${invoice.id}/items`}
      columns={INVOICE_LINE_COLUMNS}
      noDataMessage={
        <TranslatedText
          stringId="invoice.invoiceItemsTable.noData"
          fallback="No invoice items found"
        />
      }
      allowExport={false}
      elevated={false}
      headerColor={Colors.white}
      fetchOptions={{ page: undefined, order: undefined }}
      rowStyle={() => 'height: 40px;'}
      headerTextColor={Colors.midText}
      containerStyle={denseTableStyle.container}
      cellStyle={denseTableStyle.cell}
      headStyle={denseTableStyle.head}
      statusCellStyle={denseTableStyle.statusCell}
      disablePagination
      data={invoice.items}
    />
  );
};
