import React, { useState } from 'react';
import styled from 'styled-components';
import { useFormikContext } from 'formik';
import { useSuggester } from '../../../api';
import { Colors } from '../../../constants';
import { IconButton } from '@material-ui/core';
import { ArrowRight } from '../../../components/Icons';
import { useInvoicePriceListItemPriceQuery } from '../../../api/queries/useInvoicePriceListItemPriceQuery';
import { useInvoiceInsurancePlanItemsQuery } from '../../../api/queries/useInvoiceInsurancePlanItemsQuery';
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

  .MuiInputBase-input {
    font-size: 14px;
  }

  &:last-child {
    border-bottom: 1px solid ${Colors.outline};
  }
`;

const Button = styled(IconButton)`
  position: absolute;
  padding: 6px;
  top: 3px;
  left: -12px;
  transform: rotate(${props => (props.$isExpanded ? '90deg' : '0')});
  transition: transform 0.2s ease-in-out;
`;

const useInvoiceItemPrice = ({
  encounterId,
  productId,
  existingPrice,
  index,
  formArrayMethods,
}) => {
  const { values } = useFormikContext();

  const { data: fetchedPriceData, isFetching } = useInvoicePriceListItemPriceQuery({
    encounterId,
    productId,
    enabled: Boolean(productId) && !existingPrice,
    onSuccess: data => {
      if (data?.price === undefined || data?.price === null) return;

      const currentItem = values.invoiceItems[index];
      const nextProduct = {
        ...(currentItem.product || {}),
        invoicePriceListItem: {
          ...(currentItem.product?.invoicePriceListItem || {}),
          price: data.price,
        },
      };

      formArrayMethods.replace(index, {
        ...currentItem,
        product: nextProduct,
      });
    },
  });

  return {
    isFetchingPrice: isFetching,
    fetchedPrice: fetchedPriceData?.price,
  };
};

const useInvoiceItemInsurance = ({
  encounterId,
  productId,
  existingPrice,
  index,
  formArrayMethods,
}) => {
  const { values } = useFormikContext();

  useInvoiceInsurancePlanItemsQuery({
    encounterId,
    productId,
    enabled: Boolean(productId) && !existingPrice,
    onSuccess: data => {
      if (!data || data.length === 0) return;

      const currentItem = values.invoiceItems[index];
      formArrayMethods.replace(index, {
        ...currentItem,
        insurancePlanItems: data,
      });
    },
  });
};

export const InvoiceItemRow = ({
  index,
  item,
  isDeleteDisabled,
  showActionMenu,
  formArrayMethods,
  invoiceIsEditable,
  encounterId,
  priceListId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isItemEditable = !item.product?.id && invoiceIsEditable;

  const invoiceProductsSuggester = useSuggester('invoiceProduct', {
    formatter: ({ name, id }) => ({
      label: name,
      value: id,
    }),
    baseQueryParameters: { priceListId },
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
      product: null,
    });
  };

  const onClick = () => {
    setIsExpanded(!isExpanded);
  };

  const priceListPrice = item.product?.invoicePriceListItem?.price;
  const { productId } = item;

  const { isFetchingPrice, fetchedPrice } = useInvoiceItemPrice({
    encounterId,
    productId,
    existingPrice: priceListPrice,
    index,
    formArrayMethods,
  });

  useInvoiceItemInsurance({
    encounterId,
    productId,
    existingPrice: priceListPrice || item.manualEntryPrice,
    index,
    formArrayMethods,
  });

  const hidePriceInput =
    (priceListPrice !== null && priceListPrice !== undefined) ||
    !invoiceIsEditable ||
    fetchedPrice ||
    isFetchingPrice;

  return (
    <StyledItemRow>
      {!isItemEditable && item.insurancePlanItems?.length > 0 && (
        <Button onClick={onClick} $isExpanded={isExpanded}>
          <ArrowRight htmlColor={Colors.softText} />
        </Button>
      )}
      <DateCell index={index} item={item} isItemEditable={isItemEditable} />
      <DetailsCell
        index={index}
        item={item}
        isItemEditable={isItemEditable}
        invoiceProductsSuggester={invoiceProductsSuggester}
        handleChangeProduct={handleChangeProduct}
        invoiceIsEditable={invoiceIsEditable}
      />
      <CodeCell item={item} isItemEditable={isItemEditable} />
      <QuantityCell index={index} item={item} isItemEditable={isItemEditable} />
      <OrderedByCell
        index={index}
        item={item}
        isItemEditable={isItemEditable}
        practitionerSuggester={practitionerSuggester}
        handleChangeOrderedBy={handleChangeOrderedBy}
      />
      <PriceCell
        index={index}
        item={item}
        isExpanded={isExpanded}
        hidePriceInput={hidePriceInput}
        priceListItemPrice={fetchedPrice}
      />

      <InvoiceItemActionsMenu
        index={index}
        item={item}
        formArrayMethods={formArrayMethods}
        isDeleteDisabled={isDeleteDisabled}
        showActionMenu={showActionMenu && invoiceIsEditable}
        hidePriceInput={hidePriceInput}
      />
    </StyledItemRow>
  );
};
