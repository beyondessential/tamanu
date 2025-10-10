import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { differenceBy } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { INVOICE_ITEMS_CATEGORY_LABELS } from '@tamanu/constants';
import { toDateString } from '@tamanu/utils/dateTime';
import { formatDisplayPrice } from '@tamanu/shared/utils/invoice';
import { Button } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { DataFetchingTable } from '../../Table';
import { TranslatedEnum, TranslatedText } from '../../Translation';
import { DateDisplay } from '../../DateDisplay';
import { denseTableStyle } from '../../../constants';
import { useTableSorting } from '../../Table/useTableSorting';
import { NoteModalActionBlocker } from '../../NoteModalActionBlocker';
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
  flex: 1 0;
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

  const customSortWrapper = (customSort) => (data) => {
    const potentialInvoiceItems = data.map((item) => ({
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

  const onPotentialInvoiceItemsFetched = useCallback((data) => {
    setPotentialInvoiceItems(data?.data || []);
  }, []);

  const potentialInvoiceItemRowStyle = ({ sourceId }) => {
    const idList = invoiceItems.map((row) => row?.sourceId).filter(Boolean);
    if (idList.includes(sourceId)) return 'display: none;';
    return '';
  };

  const handleAddPotentialInvoiceItems = (items) => {
    if (isInvoiceItemsEmpty) formArrayMethods.remove(0);
    items.forEach(
      (item) =>
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
    (it) => it.sourceId || it.id,
  ).length;

  const POTENTIAL_INVOICE_ITEMS_TABLE_COLUMNS = [
    {
      key: 'orderDate',
      title: (
        <TranslatedText
          stringId="general.date.label"
          fallback="Date"
          data-testid="translatedtext-k54b"
        />
      ),
      accessor: ({ orderDate }) => <DateDisplay date={orderDate} data-testid="datedisplay-bayh" />,
    },
    {
      key: 'productCode',
      title: (
        <TranslatedText
          stringId="invoice.table.column.code"
          fallback="Code"
          data-testid="translatedtext-3vkg"
        />
      ),
      accessor: ({ productCode }) => productCode,
    },
    {
      key: 'productType',
      title: (
        <TranslatedText
          stringId="invoice.table.column.category"
          fallback="Category"
          data-testid="translatedtext-bls8"
        />
      ),
      accessor: ({ productType }) => (
        <TranslatedEnum
          value={productType}
          enumValues={INVOICE_ITEMS_CATEGORY_LABELS}
          data-testid="translatedenum-q8kr"
        />
      ),
    },
    {
      key: 'productPrice',
      title: (
        <TranslatedText
          stringId="invoice.table.column.price"
          fallback="Price"
          data-testid="translatedtext-vkvh"
        />
      ),
      accessor: ({ productPrice }) => `$${formatDisplayPrice(productPrice)}`,
    },
    {
      key: '',
      sortable: false,
      numeric: true, // Right aligns the cell content
      accessor: row => (
        <NoteModalActionBlocker>
          <SingleAddButton
            variant="outlined"
            onClick={() => handleAddPotentialInvoiceItems([row])}
            data-testid="singleaddbutton-sh7m"
          >
            <TranslatedText
              stringId="general.action.add"
              fallback="Add"
              data-testid="translatedtext-yvbk"
            />
          </SingleAddButton>
        </NoteModalActionBlocker>
      ),
    },
  ];

  return (
    <Container data-testid="container-iidv">
      <PaneHeader data-testid="paneheader-x4uj">
        <TranslatedText
          stringId="invoice.modal.potentialItems.title"
          fallback="Patient items to be added"
          data-testid="translatedtext-hxbk"
        />
        {!isEmptyPotentialInvoiceItems && (
          <NoteModalActionBlocker>
            <BulkAddButton
              onClick={() => handleAddPotentialInvoiceItems(potentialInvoiceItems)}
              data-testid="bulkaddbutton-ziik"
            >
              <TranslatedText
                stringId="general.action.addAll"
                fallback="Add all"
                data-testid="translatedtext-ziuk"
              />
            </BulkAddButton>
          </NoteModalActionBlocker>
        )}
      </PaneHeader>
      <StyledDataFetchingTable
        endpoint={`invoices/${invoice.id}/potentialInvoiceItems`}
        columns={POTENTIAL_INVOICE_ITEMS_TABLE_COLUMNS}
        noDataMessage={
          <TranslatedText
            stringId="invoice.modal.potentialInvoices.table.noData"
            fallback="No patient items to be added"
            data-testid="translatedtext-46l9"
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
        data-testid="styleddatafetchingtable-5cty"
      />
    </Container>
  );
};
