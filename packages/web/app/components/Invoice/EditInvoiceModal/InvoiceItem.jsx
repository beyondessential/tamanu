import React, { useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { TranslatedText } from '../../Translation';
import { AutocompleteField, DateField, Field, NumberField } from '../../Field';
import { useSuggester } from '../../../api';
import { Colors, INVOICE_ITEM_ACTION_MODAL_TYPES } from '../../../constants';
import { ThemedTooltip } from '../../Tooltip';
import { ThreeDotMenu } from '../../ThreeDotMenu';
import { InvoiceItemActionModal } from './InvoiceItemActionModal';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
} from '@tamanu/shared/utils/invoice';
import { getDateDisplay } from '../../DateDisplay';
import { useTranslation } from '../../../contexts/Translation';
import { INVOICE_ITEMS_DISCOUNT_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import { PriceField } from '../../Field/PriceField';

const PriceText = styled.span`
  margin-right: 16px;
  padding-left: 15px;
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

const StyledItemRow = styled(Box)`
  display: flex;
  gap: 10px;
  font-size: 11px;
  padding: 7.5px 20px;
  background: ${Colors.white};
  border-left: 1px solid ${Colors.outline};
  border-right: 1px solid ${Colors.outline};
  border-top: 1px solid ${Colors.outline};
  &:last-child {
    border-bottom: 1px solid ${Colors.outline};
  }
`;

const StyledItemHeader = styled(Box)`
  display: flex;
  gap: 10px;
  padding: 14px;
  padding-left: 20px;
  padding-right: 20px;
  font-weight: 500;
  border-radius: 4px 4px 0 0;
  border: 1px solid ${Colors.outline};
  border-bottom: 0;
`;

const StyledItemCell = styled(Box)`
  align-self: flex-start;
  .MuiFormHelperText-root {
    font-size: 11px;
  }
`;

const ViewOnlyCell = styled(Box)`
  font-size: ${p => (p.$hasLargeFont ? '14px' : '11px')};
  padding-left: ${p => (p.$hasLeftPadding ? '16px' : '0px')};
  display: flex;
  align-items: center;
  min-height: 39px;
`;

const PriceCell = styled(ViewOnlyCell)`
  display: flex;
  align-items: center;
  padding: 0;
  min-height: 39px;
`;

export const InvoiceItemHeader = () => {
  return (
    <StyledItemHeader>
      <Box width="12%">
        <TranslatedText stringId="general.date.label" fallback="Date" />
      </Box>
      <Box width="30%">
        <TranslatedText stringId="invoice.modal.editInvoice.details.label" fallback="Details" />
      </Box>
      <Box width="10%" paddingLeft="10px">
        <TranslatedText stringId="invoice.table.column.code" fallback="Code" />
      </Box>
      <Box width="10%" paddingLeft="10px">
        <TranslatedText stringId="invoice.table.column.quantity" fallback="Quantity" />
      </Box>
      <Box width="19%">
        <TranslatedText
          stringId="invoice.modal.editInvoice.orderedBy.label"
          fallback="Ordered by"
        />
      </Box>
      <Box width="11%" flexGrow={1} paddingLeft="10px">
        <TranslatedText stringId="invoice.modal.editInvoice.price.label" fallback="Price" />
      </Box>
    </StyledItemHeader>
  );
};

export const InvoiceItemRow = ({
  index,
  item,
  isDeleteDisabled,
  showActionMenu,
  formArrayMethods,
  editable,
}) => {
  const isItemEditable = !item.sourceId && editable;
  const { getTranslation } = useTranslation();
  const nonDiscountableTranslation = getTranslation(
    'invoice.table.details.nonDiscountable',
    'Non-discountable',
    {
      casing: 'lower',
    },
  );
  const hidePriceInput =
    item?.product?.price ||
    item?.product?.price === 0 ||
    !item?.productId?.startsWith(REFERENCE_TYPES.ADDITIONAL_INVOICE_PRODUCT) ||
    !editable;

  const invoiceProductsSuggester = useSuggester('invoiceProducts', {
    formatter: ({ name, id, ...others }) => ({
      ...others,
      productName: name,
      label: others.discountable ? name : `${name} (${nonDiscountableTranslation})`,
      value: id,
    }),
  });
  const practitionerSuggester = useSuggester('practitioner');

  const price = getInvoiceItemPriceDisplay(item);
  const discountPrice = isNaN(item.productPrice)
    ? undefined
    : getInvoiceItemDiscountPriceDisplay(item);
  const [actionModal, setActionModal] = useState();

  const onCloseActionModal = () => {
    setActionModal(undefined);
  };

  const handleAction = (data, type = actionModal) => {
    switch (type) {
      case INVOICE_ITEM_ACTION_MODAL_TYPES.DELETE: {
        formArrayMethods.remove(index);
        break;
      }
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT: {
        formArrayMethods.replace(index, {
          ...item,
          discount: {
            ...item.discount,
            amount:
              data.type === INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE
                ? data.amount / 100
                : data.amount,
            type: data.type,
            reason: data.reason,
          },
        });
        break;
      }
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP: {
        formArrayMethods.replace(index, {
          ...item,
          discount: {
            ...item.discount,
            amount:
              data.type === INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE
                ? -(data.amount / 100)
                : -data.amount,
            type: data.type,
            reason: data.reason,
          },
        });
        break;
      }
      case INVOICE_ITEM_ACTION_MODAL_TYPES.REMOVE_DISCOUNT_MARKUP: {
        formArrayMethods.replace(index, {
          ...item,
          discount: undefined,
        });
        break;
      }
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_NOTE: {
        formArrayMethods.replace(index, {
          ...item,
          note: data.note,
        });
        break;
      }
    }
    onCloseActionModal();
  };

  const menuItems = [
    {
      label:
        Number(item.discount?.amount) < 0 ? (
          <TranslatedText
            stringId="invoice.modal.editInvoice.removeMarkup"
            fallback="Remove markup"
          />
        ) : (
          <TranslatedText
            stringId="invoice.modal.editInvoice.removeDiscount"
            fallback="Remove discount"
          />
        ),
      onClick: () => handleAction({}, INVOICE_ITEM_ACTION_MODAL_TYPES.REMOVE_DISCOUNT_MARKUP),
      hidden: !item.discount?.amount,
    },
    {
      label: (
        <TranslatedText stringId="invoice.modal.editInvoice.addDiscount" fallback="Add discount" />
      ),
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT),
      disabled: !item.productId,
      hidden: !!item.discount?.amount || !hidePriceInput,
    },
    {
      label: (
        <TranslatedText stringId="invoice.modal.editInvoice.addMarkup" fallback="Add markup" />
      ),
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP),
      disabled: !item.productId,
      hidden: !!item.discount?.amount || !hidePriceInput,
    },
    {
      label: item.note ? (
        <TranslatedText stringId="invoice.modal.editInvoice.editNote" fallback="Edit note" />
      ) : (
        <TranslatedText stringId="invoice.modal.editInvoice.addNote" fallback="Add note" />
      ),
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_NOTE),
      disabled: !item.productId,
      hidden: !!item.sourceId,
    },
    {
      label: <TranslatedText stringId="invoice.modal.editInvoice.delete" fallback="Delete" />,
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.DELETE),
      disabled: isDeleteDisabled,
    },
  ];

  const handleChangeOrderedBy = e => {
    formArrayMethods.replace(index, {
      ...item,
      orderedByUser: {
        displayName: e.target.label,
      },
    });
  };

  const handleChangeProduct = e => {
    const value = e.target;
    formArrayMethods.replace(index, {
      ...item,
      productName: value.productName,
      productCode: value.code,
      productDiscountable: value.discountable,
      product: { ...item.product, price: value.price },
      ...(value.price !== null && { productPrice: value.price }),
    });
  };

  return (
    <>
      <StyledItemRow alignItems="center" spacing={1} wrap="nowrap">
        <StyledItemCell width="12%">
          {isItemEditable ? (
            <Field
              name={`invoiceItems.${index}.orderDate`}
              required
              component={DateField}
              size="small"
              saveDateAsString
            />
          ) : (
            <ViewOnlyCell $hasLargeFont={!editable} $hasLeftPadding={editable}>
              {item?.orderDate ? getDateDisplay(item?.orderDate, 'dd/MM/yyyy') : ''}
            </ViewOnlyCell>
          )}
        </StyledItemCell>
        <StyledItemCell width="30%">
          {isItemEditable ? (
            <Field
              name={`invoiceItems.${index}.productId`}
              required
              component={AutocompleteField}
              suggester={invoiceProductsSuggester}
              size="small"
              onChange={handleChangeProduct}
            />
          ) : (
            <ViewOnlyCell $hasLargeFont={!editable} $hasLeftPadding={editable}>
              {item.productName}
              {item.productId &&
                (item.productDiscountable ? '' : ` (${nonDiscountableTranslation})`)}
            </ViewOnlyCell>
          )}
          {item.note && (
            <Box
              paddingLeft={editable ? '15px' : 0}
              marginTop={editable ? '4px' : '-8px'}
              color={Colors.darkText}
            >
              <TranslatedText stringId="invoice.modal.editInvoice.note.label" fallback="Note" />
              {`: ${item.note}`}
            </Box>
          )}
        </StyledItemCell>
        <StyledItemCell width="10%" paddingLeft="10px">
          <ViewOnlyCell $hasLargeFont={!editable}>{item.productCode}</ViewOnlyCell>
        </StyledItemCell>
        <StyledItemCell width="10%" paddingLeft="10px">
          {isItemEditable ? (
            <Field
              name={`invoiceItems.${index}.quantity`}
              component={NumberField}
              min={1}
              max={99}
              onInput={event => {
                if (!event.target.validity.valid) {
                  event.target.value = '';
                }
              }}
              size="small"
              required
            />
          ) : (
            <ViewOnlyCell $hasLargeFont={!editable} $hasLeftPadding={editable}>
              {item?.quantity}
            </ViewOnlyCell>
          )}
        </StyledItemCell>
        <StyledItemCell width="19%">
          {isItemEditable ? (
            <Field
              name={`invoiceItems.${index}.orderedByUserId`}
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
              size="small"
              onChange={handleChangeOrderedBy}
            />
          ) : (
            <ViewOnlyCell $hasLargeFont={!editable} $hasLeftPadding={editable}>
              {item?.orderedByUser?.displayName}
            </ViewOnlyCell>
          )}
        </StyledItemCell>
        <StyledItemCell width="11%" sx={{ flexGrow: 1 }} paddingLeft="10px">
          <PriceCell $hasLargeFont={!editable}>
            {hidePriceInput ? (
              <>
                <PriceText $isCrossedOut={!!discountPrice}>{price}</PriceText>
                {!!discountPrice && (
                  <ThemedTooltip
                    key={item.discount?.reason}
                    title={item.discount?.reason}
                    open={item.discount?.reason ? undefined : false}
                  >
                    <span>{discountPrice}</span>
                  </ThemedTooltip>
                )}
              </>
            ) : (
              item.productId && (
                <Field
                  name={`invoiceItems.${index}.productPrice`}
                  component={PriceField}
                  required
                  style={{ width: '100%' }}
                />
              )
            )}
            {showActionMenu && editable && <ThreeDotMenu items={menuItems} />}
          </PriceCell>
        </StyledItemCell>
      </StyledItemRow>
      {actionModal && (
        <InvoiceItemActionModal
          open
          action={actionModal}
          onClose={onCloseActionModal}
          onAction={data => handleAction(data)}
          item={item}
        />
      )}
    </>
  );
};
