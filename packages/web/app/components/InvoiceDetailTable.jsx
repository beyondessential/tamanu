import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { Colors, denseTableStyle } from '../constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TranslatedText } from './Translation';
import { getInvoiceLineCode } from '../utils/invoiceDetails';

const getDisplayName = ({ orderedBy }) => orderedBy?.displayName ?? '';

const getInvoiceLineCategory = row => {
  const { name } = row.invoiceLineType;
  return (
    <span>{name}</span>
  );
};

const StyledTitleCell = ({ value }) => (
  <Box sx={{ color: Colors.midText, fontWeight: 400 }}>
    {value}
  </Box>
);

const PriceCell = styled.div`
  display: flex;
  gap: 10px;
`;

const PriceText = styled.span`
  text-decoration: ${props => props.isCrossedOut ? 'line-through' : 'none'};
`;

const getPrice = (row) => {
  const originalPrice = parseFloat(row?.invoiceLineType?.price).toFixed(2);
  const percentageChange = row.percentageChange ? parseFloat(row.percentageChange).toFixed(2) : 0;
  const priceChange = (originalPrice * percentageChange).toFixed(2);
  const finalPrice = (+originalPrice + (+priceChange)).toFixed(2);

  return (
    <PriceCell>
      <PriceText isCrossedOut={!!percentageChange}>{originalPrice}</PriceText>
      {!!percentageChange && <span>{finalPrice}</span>}
    </PriceCell>
  );
};

const INVOICE_LINE_COLUMNS = [
  {
    key: 'dateGenerated',
    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
    sortable: false,
    accessor: ({ dateGenerated }) => <DateDisplay date={dateGenerated} />,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'category',
    title: <TranslatedText stringId="invoice.table.column.details" fallback="Details" />,
    sortable: false,
    accessor: getInvoiceLineCategory,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'code',
    title: <TranslatedText stringId="invoice.table.column.code" fallback="Code" />,
    sortable: false,
    accessor: getInvoiceLineCode,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'orderedBy',
    title: <TranslatedText stringId="invoice.table.column.orderedBy" fallback="Ordered by" />,
    sortable: false,
    accessor: getDisplayName,
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

export const InvoiceDetailTable = React.memo(({ invoice, updateLineItems }) => {
  return (
    <DataFetchingTable
      endpoint={`invoices/${invoice.id}/lineItems`}
      columns={INVOICE_LINE_COLUMNS}
      noDataMessage={
        <TranslatedText
          stringId="invoice.line.table.noData"
          fallback="No invoice line items found"
        />
      }
      allowExport={false}
      elevated={false}
      headerColor={Colors.white}
      fetchOptions={{ page: undefined, order: undefined }}
      onDataFetched={updateLineItems}
      rowStyle={() => 'height: 40px;'}
      headerTextColor={Colors.midText}
      containerStyle={denseTableStyle.container}
      cellStyle={denseTableStyle.cell}
      headStyle={denseTableStyle.head}
      statusCellStyle={denseTableStyle.statusCell}
      disablePagination
    />
  );
});
