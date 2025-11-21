import React, { useState } from 'react';
import styled from 'styled-components';
import { useSuggester } from '../../../api';
import { Colors } from '../../../constants';
import { IconButton } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import { useTranslation } from '../../../contexts/Translation';
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
  const { getTranslation } = useTranslation();
  const nonDiscountableTranslation = getTranslation(
    'invoice.table.details.nonDiscountable',
    'Non-discountable',
    {
      casing: 'lower',
    },
  );

  const invoiceProductsSuggester = useSuggester('invoiceProduct', {
    formatter: ({ name, id, ...others }) => ({
      ...others,
      productName: name,
      label: others.discountable ? name : `${name} (${nonDiscountableTranslation})`,
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
    // Build a lightweight product object to keep price list details in form state
    const nextProduct = {
      name: value.productName,
      code: value.code,
      discountable: value.discountable,
    };
    if (value.invoicePriceListItem) {
      nextProduct.invoicePriceListItem = value.invoicePriceListItem;
    }

    formArrayMethods.replace(index, {
      ...item,
      productId: value.value,
      productName: value.productName,
      productCode: value.code,
      productDiscountable: value.discountable,
      // Store nested product details so downstream logic can read price list info
      product: nextProduct,
    });
  };

  const onClick = () => {
    setIsExpanded(!isExpanded);
  };
  // Todo: Determine input state based on productPriceManualEntry when it's implemented
  const priceListPrice = item.product?.invoicePriceListItem?.price;
  const hidePriceInput = (priceListPrice !== null && priceListPrice !== undefined) || !editable;

  // Enable fetching only if a product is selected, the form doesn't already have the price
  const hasKnownPrice = Boolean(item?.product?.invoicePriceListItem?.price);

  const { data: fetchedPriceData } = useInvoicePriceListItemPriceQuery({
    encounterId,
    productId: item.productId,
    enabled: !hasKnownPrice,
  });

  // When price is fetched, populate it into the form state for this row
  React.useEffect(() => {
    if (fetchedPriceData && fetchedPriceData.price != null) {
      const { price } = fetchedPriceData;

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedPriceData]);

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
        nonDiscountableTranslation={nonDiscountableTranslation}
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
      <PriceCell
        index={index}
        item={item}
        isExpanded={isExpanded}
        hidePriceInput={hidePriceInput}
        priceListItemPrice={fetchedPriceData?.price}
      />
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
