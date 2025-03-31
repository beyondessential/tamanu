import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
} from '@tamanu/shared/utils/invoice';

import { Colors, denseTableStyle } from '../../constants';
import { DataFetchingTable } from '../Table';
import { DateDisplay } from '../DateDisplay';
import { TranslatedText } from '../Translation';
import { ThemedTooltip } from '../Tooltip';

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
  const price = getInvoiceItemPriceDisplay(row);
  const discountPrice = getInvoiceItemDiscountPriceDisplay(row);

  return (
    <PriceCell>
      <PriceText isCrossedOut={!!discountPrice}>{price}</PriceText>
      {!!discountPrice && (
        <ThemedTooltip title={row.discount?.reason} open={row.discount?.reason ? undefined : false}>
          <span>{discountPrice}</span>
        </ThemedTooltip>
      )}
    </PriceCell>
  );
};

const getInvoiceItemDetails = row => {
  if (row.productDiscountable) {
    return row.productName;
  }
  return (
    <>
      {row.productName} {'('}
      <TranslatedText
        stringId="invoice.table.details.nonDiscountable"
        fallback="Non-discountable"
        data-testid='translatedtext-soer' />
      {')'}
    </>
  );
};

const INVOICE_LINE_COLUMNS = [
  {
    key: 'orderDate',
    title: <TranslatedText
      stringId="general.date.label"
      fallback="Date"
      data-testid='translatedtext-c0gy' />,
    sortable: false,
    accessor: ({ orderDate }) => <DateDisplay date={orderDate} data-testid='datedisplay-oqq8' />,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'details',
    title: <TranslatedText
      stringId="invoice.table.column.details"
      fallback="Details"
      data-testid='translatedtext-5kbg' />,
    sortable: false,
    accessor: getInvoiceItemDetails,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'productCode',
    title: <TranslatedText
      stringId="invoice.table.column.code"
      fallback="Code"
      data-testid='translatedtext-64xy' />,
    sortable: false,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'quantity',
    title: <TranslatedText
      stringId="invoice.table.column.quantity"
      fallback="Quantity"
      data-testid='translatedtext-opva' />,
    sortable: false,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'orderedBy',
    title: <TranslatedText
      stringId="invoice.table.column.orderedBy"
      fallback="Ordered by"
      data-testid='translatedtext-amlq' />,
    sortable: false,
    accessor: ({ orderedByUser }) => orderedByUser?.displayName,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'price',
    title: <TranslatedText
      stringId="invoice.table.column.price"
      fallback="Price"
      data-testid='translatedtext-qbco' />,
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
          data-testid='translatedtext-9dbw' />
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
      data-testid='datafetchingtable-srcl' />
  );
};
