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
import { INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
import { PriceField } from '../../Field/PriceField';
import { NoteModalActionBlocker } from '../../NoteModalActionBlocker';

const PriceText = styled.span`
  margin-right: 16px;
  padding-left: 15px;
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

const StyledItemRow = styled(Box)`
  display: flex;
  gap: 10px;
  font-size: 14px;
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

const ItemHeadCell = styled(Box)`
  padding-left: 15px;
`;

const StyledItemCell = styled(Box)`
  align-self: flex-start;
  .MuiFormHelperText-root {
    font-size: 14px;
  }
`;

const ViewOnlyCell = styled(ItemHeadCell)`
  font-size: 14px;
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
    <StyledItemHeader data-testid="styleditemheader-8x5j">
      <ItemHeadCell width="14%">
        <TranslatedText stringId="general.date.label" fallback="Date" />
      </ItemHeadCell>
      <ItemHeadCell width="28%">
        <TranslatedText stringId="invoice.modal.editInvoice.details.label" fallback="Details" />
      </ItemHeadCell>
      <ItemHeadCell width="10%">
        <TranslatedText stringId="invoice.table.column.code" fallback="Code" />
      </ItemHeadCell>
      <ItemHeadCell width="10%">
        <TranslatedText stringId="invoice.table.column.quantity" fallback="Quantity" />
      </ItemHeadCell>
      <ItemHeadCell width="19%">
        <TranslatedText
          stringId="invoice.modal.editInvoice.orderedBy.label"
          fallback="Ordered by"
          data-testid="translatedtext-b5me"
        />
      </ItemHeadCell>
      <ItemHeadCell width="11%" sx={{ flexGrow: 1 }}>
        <TranslatedText stringId="invoice.modal.editInvoice.price.label" fallback="Price" />
      </ItemHeadCell>
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
  // Todo: Determine input state based on productPriceManualEntry when it's implemented
  const hidePriceInput = item.productPrice === undefined || !editable;

  const invoiceProductsSuggester = useSuggester('invoiceProduct', {
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
            data-testid="translatedtext-hhna"
          />
        ) : (
          <TranslatedText
            stringId="invoice.modal.editInvoice.removeDiscount"
            fallback="Remove discount"
            data-testid="translatedtext-n4xe"
          />
        ),
      onClick: () => handleAction({}, INVOICE_ITEM_ACTION_MODAL_TYPES.REMOVE_DISCOUNT_MARKUP),
      hidden: !item.discount?.amount,
    },
    {
      label: (
        <TranslatedText
          stringId="invoice.modal.editInvoice.addDiscount"
          fallback="Add discount"
          data-testid="translatedtext-huq9"
        />
      ),
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT),
      disabled: !item.productId,
      hidden: !!item.discount?.amount || !hidePriceInput,
    },
    {
      label: (
        <TranslatedText
          stringId="invoice.modal.editInvoice.addMarkup"
          fallback="Add markup"
          data-testid="translatedtext-5y9x"
        />
      ),
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP),
      disabled: !item.productId,
      hidden: !!item.discount?.amount || !hidePriceInput,
    },
    {
      label: item.note ? (
        <TranslatedText
          stringId="invoice.modal.editInvoice.editNote"
          fallback="Edit note"
          data-testid="translatedtext-bqqi"
        />
      ) : (
        <TranslatedText
          stringId="invoice.modal.editInvoice.addNote"
          fallback="Add note"
          data-testid="translatedtext-swkc"
        />
      ),
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_NOTE),
      disabled: !item.productId,
      hidden: !!item.sourceId,
    },
    {
      label: (
        <TranslatedText
          stringId="invoice.modal.editInvoice.delete"
          fallback="Delete"
          data-testid="translatedtext-wwxo"
        />
      ),
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
    });
  };

  return (
    <>
      <StyledItemRow alignItems="center" spacing={1} wrap="nowrap">
        <StyledItemCell width="14%">
          {isItemEditable ? (
            <NoteModalActionBlocker>
              <Field
                name={`invoiceItems.${index}.orderDate`}
                required
                component={DateField}
                saveDateAsString
                data-testid="field-e3dv"
              />
            </NoteModalActionBlocker>
          ) : (
            <ViewOnlyCell>
              {item?.orderDate ? getDateDisplay(item?.orderDate, 'dd/MM/yyyy') : ''}
            </ViewOnlyCell>
          )}
        </StyledItemCell>
        <StyledItemCell width="28%">
          {isItemEditable ? (
            <NoteModalActionBlocker>
              <Field
                name={`invoiceItems.${index}.productId`}
                required
                component={AutocompleteField}
                suggester={invoiceProductsSuggester}
                onChange={handleChangeProduct}
                data-testid="field-f5fm"
              />
            </NoteModalActionBlocker>
          ) : (
            <ViewOnlyCell>
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
              data-testid="box-dedu"
            >
              <TranslatedText
                stringId="invoice.modal.editInvoice.note.label"
                fallback="Note"
                data-testid="translatedtext-k4c8"
              />
              {`: ${item.note}`}
            </Box>
          )}
        </StyledItemCell>
        <StyledItemCell width="10%">
          <ViewOnlyCell>{item.productCode}</ViewOnlyCell>
        </StyledItemCell>
        <StyledItemCell width="10%" paddingLeft="24px">
          {isItemEditable ? (
            <NoteModalActionBlocker>
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
                data-testid="field-6aku"
              />
            </NoteModalActionBlocker>
          ) : (
            <ViewOnlyCell>{item?.quantity}</ViewOnlyCell>
          )}
        </StyledItemCell>
        <StyledItemCell width="19%" data-testid="styleditemcell-tfvb">
          {isItemEditable ? (
            <NoteModalActionBlocker>
              <Field
                name={`invoiceItems.${index}.orderedByUserId`}
                required
                component={AutocompleteField}
                suggester={practitionerSuggester}
                size="small"
                onChange={handleChangeOrderedBy}
                data-testid="field-xin4"
              />
            </NoteModalActionBlocker>
          ) : (
            <ViewOnlyCell>{item?.orderedByUser?.displayName}</ViewOnlyCell>
          )}
        </StyledItemCell>
        <StyledItemCell width="11%" sx={{ flexGrow: 1 }}>
          <PriceCell>
            {hidePriceInput ? (
              <>
                <PriceText $isCrossedOut={!!discountPrice} data-testid="pricetext-is33">
                  {price}
                </PriceText>
                {!!discountPrice && (
                  <ThemedTooltip
                    key={item.discount?.reason}
                    title={item.discount?.reason}
                    open={item.discount?.reason ? undefined : false}
                    data-testid="themedtooltip-jrhk"
                  >
                    <span>{discountPrice}</span>
                  </ThemedTooltip>
                )}
              </>
            ) : (
              item.productId && (
                <NoteModalActionBlocker>
                  <Field
                    name={`invoiceItems.${index}.productPrice`}
                    component={PriceField}
                    required
                    style={{ width: '100%' }}
                    data-testid="field-05x9"
                  />
                </NoteModalActionBlocker>
              )
            )}
            {showActionMenu && editable && (
              <NoteModalActionBlocker>
                <ThreeDotMenu items={menuItems} data-testid="threedotmenu-zw6l" />
              </NoteModalActionBlocker>
            )}
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
          data-testid="invoiceitemactionmodal-lar4"
        />
      )}
    </>
  );
};
