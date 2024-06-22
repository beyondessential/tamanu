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
  getInvoiceItemName,
  getInvoiceItemCode,
} from '@tamanu/shared/utils/invoice';
import { getDateDisplay } from '../../DateDisplay';

const PriceText = styled.span`
  margin-right: 16px;
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

const StyledItemRow = styled(Box)`
  display: flex;
  gap: 10px;
  font-size: 11px;
  padding-left: 20px;
  padding-right: 13px;
  padding-top: 10px;
  padding-bottom: 10px;
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
`;

const CodeCell = styled(Box)`
  margin-left: 5%;
`;

const PriceCell = styled.div`
  margin-left: 10%;
  display: flex;
  align-items: center;
`;

const ViewOnlyCell = styled(Box)`
  font-size: 14px;
  padding: 8px 0;
`;

export const InvoiceItemHeader = () => {
  return (
    <StyledItemHeader>
      <Box width="12%" >
        <TranslatedText stringId="general.date.label" fallback="Date" />
      </Box>
      <Box width="32%">
        <TranslatedText stringId="invoice.modal.addInvoice.details.label" fallback="Details" />
      </Box>
      <Box width="7%">
        <CodeCell>
          <TranslatedText stringId="invoice.table.column.code" fallback="Code" />
        </CodeCell>
      </Box>
      <Box width="6%" marginLeft="5px">
        <TranslatedText stringId="invoice.table.column.quantity" fallback="Quantity" />
      </Box>
      <Box width="23%">
        <TranslatedText stringId="invoice.modal.addInvoice.orderedBy.label" fallback="Ordered by" />
      </Box>
      <Box width="10%" marginLeft="2px">
        <PriceCell>
          <TranslatedText stringId="invoice.modal.addInvoice.price.label" fallback="Price" />
        </PriceCell>
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
  const invoiceProductsSuggester = useSuggester('invoiceProducts', {
    formatter: ({ name, id, ...others }) => ({ ...others, label: name, value: id }),
  });
  const practitionerSuggester = useSuggester('practitioner');

  const price = getInvoiceItemPriceDisplay(item);
  const discountPrice = getInvoiceItemDiscountPriceDisplay(item);

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
            percentage: data.percentage / 100,
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
            percentage: -(data.percentage / 100),
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
    }
    onCloseActionModal();
  };

  const menuItems = [
    ...(item.discount?.percentage
      ? [
        {
          label:
            Number(item.discount?.percentage) < 0 ? (
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
        },
      ]
      : [
        {
          label: (
            <TranslatedText
              stringId="invoice.modal.editInvoice.addDiscount"
              fallback="Add discount"
            />
          ),
          onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT),
        },
        {
          label: (
            <TranslatedText
              stringId="invoice.modal.editInvoice.addMarkup"
              fallback="Add markup"
            />
          ),
          onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP),
        },
      ]),
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
      productName: value.label,
      productCode: value.code,
      productPrice: value.price,
    });
  };

  return (
    <>
      <StyledItemRow container alignItems="center" spacing={1} wrap="nowrap">
        <Box width="12%">
          {editable ? (
            <Field
              name={`invoiceItems.${index}.orderDate`}
              required
              component={DateField}
              size="small"
              saveDateAsString
            />
          ) : (
            <ViewOnlyCell>{getDateDisplay(item?.orderDate, 'dd/MM/yyyy')}</ViewOnlyCell>
          )}
        </Box>
        <Box width="32%">
          {editable ? (
            <Field
              name={`invoiceItems.${index}.productId`}
              required
              component={AutocompleteField}
              suggester={invoiceProductsSuggester}
              size="small"
              onChange={handleChangeProduct}
            />
          ) : (
            <ViewOnlyCell>{getInvoiceItemName(item)}</ViewOnlyCell>
          )}
        </Box>
        <Box width="7%">
          {editable ? (
            <CodeCell minHeight="39px" display="flex" alignItems="center">
              {getInvoiceItemCode(item)}
            </CodeCell>
          ) : (
            <ViewOnlyCell marginLeft="5%">{getInvoiceItemCode(item)}</ViewOnlyCell>
          )}
        </Box>
        <Box width="6%">
          {editable ? (
            <Field
              name={`invoiceItems.${index}.quantity`}
              component={NumberField}
              min={1}
              onInput={event => {
                if (!event.target.validity.valid) {
                  event.target.value = '';
                }
              }}
              size="small"
              required
            />
          ) : (
            <ViewOnlyCell marginLeft="5px">{item?.quantity}</ViewOnlyCell>
          )}
        </Box>
        <Box width="23%">
          {editable ? (
            <Field
              name={`invoiceItems.${index}.orderedByUserId`}
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
              size="small"
              onChange={handleChangeOrderedBy}
            />
          ) : (
            <ViewOnlyCell marginLeft="4px">{item?.orderedByUser?.displayName}</ViewOnlyCell>
          )}
        </Box>
        <Box width="10%" sx={{ flexGrow: 1 }}>
          {editable ? (
            <PriceCell>
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
              {showActionMenu && <ThreeDotMenu items={menuItems} />}
            </PriceCell>
          ) : (
            <ViewOnlyCell marginLeft="10%">
              <PriceText $isCrossedOut={!!discountPrice}>{price}</PriceText>
              {!!discountPrice && (
                <ThemedTooltip
                  title={item.discount?.reason}
                  open={item.discount?.reason ? undefined : false}
                >
                  <span>{discountPrice}</span>
                </ThemedTooltip>
              )}
            </ViewOnlyCell>
          )}
        </Box>
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
