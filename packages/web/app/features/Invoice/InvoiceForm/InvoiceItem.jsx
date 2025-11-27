import React, { useState } from 'react';
import styled from 'styled-components';
import { useSuggester } from '../../../api';
import { Colors } from '../../../constants';
import { IconButton } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import { useInvoicePriceListItemPriceQuery } from '../../../api/queries/useInvoicePriceListItemPriceQuery';
import {
  PriceCell,
  DateCell,
  DetailsCell,
  CodeCell,
  QuantityCell,
  OrderedByCell,
} from './InvoiceItemCells';
import { InvoiceItemActionsMenu } from './InvoiceItemActionsMenu';

const StyledItemRow = styled.div`
  position: relative;
  display: flex;
  gap: 10px;
  font-size: 14px;
  padding: 12px 50px 12px 10px;
  background: ${Colors.white};
  border-top: 1px solid ${Colors.outline};
  flex-wrap: nowrap;
  align-items: flex-start;

  &:last-child {
    border-bottom: 1px solid ${Colors.outline};
  }
`;

const Button = styled(IconButton)`
  position: absolute;
  padding: 6px;
  top: 0;
  left: -15px;
  transform: rotate(${props => (props.$isExpanded ? '90deg' : '0')});
  transition: transform 0.2s ease-in-out;

  .MuiSvgIcon-root {
    font-size: 32px;
    color: #b8b8b8;
  }
`;

export const InvoiceItemRow = ({
  index,
  item,
  isDeleteDisabled,
  showActionMenu,
  formArrayMethods,
  editable,
  encounterId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isItemEditable = !item.product?.sourceRecordId && editable;

  const invoiceProductsSuggester = useSuggester('invoiceProduct', {
    formatter: ({ name, id }) => ({
      label: name,
      value: id,
    }),
  });
  const practitionerSuggester = useSuggester('practitioner');

  const handleChangeOrderedBy = e => {
    formArrayMethods.replace(index, {
      ...item,
      orderedByUserId: e.target.value,
      orderedByUser: {
        displayName: e.target.label,
      },
    });
  };

  const handleChangeProduct = e => {
    const value = e.target;
    formArrayMethods.replace(index, {
      ...item,
      productId: value.value,
    });
  };

  const onClick = () => {
    setIsExpanded(!isExpanded);
  };
  // Todo: Determine input state based on productPriceManualEntry when it's implemented
  const priceListPrice = item.product?.invoicePriceListItem?.price;
  const hasKnownPrice = Boolean(priceListPrice);

  // Todo: Also need to lookup the insurance plan for the product
  const { data: fetchedPriceData, isFetching } = useInvoicePriceListItemPriceQuery({
    encounterId,
    productId: item.productId,
    enabled: !hasKnownPrice,
    onSuccess: data => {
      if (!data?.price) {
        return;
      }
      // If there is a price list price, update the form data
      const { price } = data;

      const nextProduct = {
        ...(item.product || {}),
        invoicePriceListItem: {
          ...(item.product?.invoicePriceListItem || {}),
          price,
        },
      };
      formArrayMethods.replace(index, {
        ...item,
        product: nextProduct,
      });
    },
  });

  const hidePriceInput =
    (priceListPrice !== null && priceListPrice !== undefined) ||
    !editable ||
    fetchedPriceData?.price;

  return (
    <StyledItemRow>
      {item.insurancePlanItems?.length > 0 && (
        <Button onClick={onClick} $isExpanded={isExpanded}>
          <ChevronRight />
        </Button>
      )}
      <DateCell index={index} item={item} isItemEditable={isItemEditable} />
      <DetailsCell
        index={index}
        item={item}
        isItemEditable={isItemEditable}
        invoiceProductsSuggester={invoiceProductsSuggester}
        handleChangeProduct={handleChangeProduct}
        editable={editable}
      />
      <CodeCell item={item} />
      <QuantityCell index={index} item={item} isItemEditable={isItemEditable} />
      <OrderedByCell
        index={index}
        item={item}
        isItemEditable={isItemEditable}
        practitionerSuggester={practitionerSuggester}
        handleChangeOrderedBy={handleChangeOrderedBy}
      />
      {!isFetching && (
        <PriceCell
          index={index}
          item={item}
          isExpanded={isExpanded}
          hidePriceInput={hidePriceInput}
          priceListItemPrice={fetchedPriceData?.price}
        />
      )}
      <InvoiceItemActionsMenu
        index={index}
        item={item}
        formArrayMethods={formArrayMethods}
        isDeleteDisabled={isDeleteDisabled}
        showActionMenu={showActionMenu}
        editable={editable}
        hidePriceInput={hidePriceInput}
      />
    </StyledItemRow>
  );
};
