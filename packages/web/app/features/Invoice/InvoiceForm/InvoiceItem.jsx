import React, { useState } from 'react';
import styled from 'styled-components';
import { useFormikContext } from 'formik';
import { Colors } from '../../../constants';
import { IconButton } from '@material-ui/core';
import { ArrowRight } from '../../../components/Icons';
import { useInvoicePriceListItemPriceQuery } from '../../../api/queries/useInvoicePriceListItemPriceQuery';
import { useInvoiceInsurancePlanItemsQuery } from '../../../api/queries/useInvoiceInsurancePlanItemsQuery';
import {
  PriceCell,
  DateCell,
  DetailsCell,
  QuantityCell,
  OrderedByCell,
  ApprovedCell,
  NetCostCell,
} from './InvoiceItemCells';
import { InvoiceItemActionsMenu } from './InvoiceItemActionsMenu';

const StyledItemRow = styled.div`
  position: relative;
  display: flex;
  gap: 10px;
  font-size: 14px;
  padding: 12px 50px 12px 30px;
  background: ${Colors.white};
  border-bottom: 1px solid ${Colors.outline};

  .MuiInputBase-input {
    font-size: 14px;
  }

  .MuiFormControl-root {
    margin: -8px 0 -8px -6px;
  }
`;

const Button = styled(IconButton)`
  position: absolute;
  padding: 6px;
  top: 4px;
  left: -4px;
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
  formArrayMethods,
  encounterId,
  priceListId,
  isEditing,
  onUpdateInvoice,
  onUpdateApproval,
  isFinalised,
  isCancelled,
  cellWidths,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSaved = item.product?.id;

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
    fetchedPrice ||
    isFetchingPrice ||
    (!isEditing && isSaved);

  return (
    <StyledItemRow>
      {!isEditing && item.insurancePlanItems?.length > 0 && (
        <Button onClick={onClick} $isExpanded={isExpanded}>
          <ArrowRight htmlColor={Colors.softText} />
        </Button>
      )}
      <DateCell index={index} item={item} isEditing={isEditing} cellWidths={cellWidths} />
      <DetailsCell
        index={index}
        item={item}
        handleChangeProduct={handleChangeProduct}
        priceListId={priceListId}
        isEditing={isEditing}
        isSaved={isSaved}
      />
      <QuantityCell index={index} item={item} isEditing={isEditing} cellWidths={cellWidths} />
      <ApprovedCell item={item} cellWidths={cellWidths} />
      <OrderedByCell
        index={index}
        item={item}
        isEditing={isEditing}
        handleChangeOrderedBy={handleChangeOrderedBy}
        cellWidths={cellWidths}
      />
      <PriceCell
        index={index}
        item={item}
        isExpanded={isExpanded}
        hidePriceInput={hidePriceInput}
        priceListItemPrice={fetchedPrice}
        isEditing={isEditing}
        isSaved={isSaved}
        cellWidths={cellWidths}
      />
      <NetCostCell item={item} cellWidths={cellWidths} />
      {!isCancelled && !isEditing && (
        <InvoiceItemActionsMenu
          index={index}
          item={item}
          showActionMenu
          hidePriceInput={hidePriceInput}
          onUpdateInvoice={onUpdateInvoice}
          onUpdateApproval={onUpdateApproval}
          isFinalised={isFinalised}
          isSaved={isSaved}
        />
      )}
    </StyledItemRow>
  );
};
