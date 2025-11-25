import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
} from '@tamanu/shared/utils/invoice';

import { Colors, denseTableStyle } from '../../constants';
import { DataFetchingTable } from '../../components/Table';
import { DateDisplay } from '../../components/DateDisplay';
import { TranslatedText } from '../../components/Translation';
import { ThemedTooltip } from '../../components/Tooltip';

const StyledTitleCell = ({ value }) => (
  <Box sx={{ color: Colors.midText, fontWeight: 400 }} data-testid="box-f4ea">
    {value}
  </Box>
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
    <PriceCell data-testid="pricecell-wkn4">
      <PriceText isCrossedOut={!!discountPrice} data-testid="pricetext-gvh2">
        {price}
      </PriceText>
      {!!discountPrice && (
        <ThemedTooltip
          title={row.discount?.reason}
          open={row.discount?.reason ? undefined : false}
          data-testid="themedtooltip-5fw6"
        >
          <span>{discountPrice}</span>
        </ThemedTooltip>
      )}
    </PriceCell>
  );
};

const getInvoiceItemDetails = row => {
  return row.productNameFinal ?? row.product.name;
};

const INVOICE_LINE_COLUMNS = [
  {
    key: 'orderDate',
    title: (
      <TranslatedText
        stringId="general.date.label"
        fallback="Date"
        data-testid="translatedtext-l3fm"
      />
    ),
    sortable: false,
    accessor: ({ orderDate }) => <DateDisplay date={orderDate} data-testid="datedisplay-p1sz" />,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'details',
    title: (
      <TranslatedText
        stringId="invoice.table.column.details"
        fallback="Details"
        data-testid="translatedtext-74nz"
      />
    ),
    sortable: false,
    accessor: getInvoiceItemDetails,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'productCodeFinal',
    title: (
      <TranslatedText
        stringId="invoice.table.column.code"
        fallback="Code"
        data-testid="translatedtext-78cn"
      />
    ),
    sortable: false,
    accessor: ({ productCodeFinal, productCode }) => productCodeFinal ?? productCode,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'quantity',
    title: (
      <TranslatedText
        stringId="invoice.table.column.quantity"
        fallback="Quantity"
        data-testid="translatedtext-kkh9"
      />
    ),
    sortable: false,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'orderedBy',
    title: (
      <TranslatedText
        stringId="invoice.table.column.orderedBy"
        fallback="Ordered by"
        data-testid="translatedtext-cn4a"
      />
    ),
    sortable: false,
    accessor: ({ orderedByUser }) => orderedByUser?.displayName,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'price',
    title: (
      <TranslatedText
        stringId="invoice.table.column.price"
        fallback="Price"
        data-testid="translatedtext-9x8l"
      />
    ),
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
          data-testid="translatedtext-1bb4"
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
      data-testid="datafetchingtable-66i5"
    />
  );
};
