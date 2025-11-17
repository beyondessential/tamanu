import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
} from '@tamanu/shared/utils/invoice';
import {
  AutocompleteField,
  DateField,
  Field,
  NumberField,
  TranslatedText,
  getDateDisplay,
  NoteModalActionBlocker,
} from '../../../components';
import { Colors } from '../../../constants';
import { useInvoiceItemActions } from './useInvoiceItemActions';
import { ThemedTooltip } from '@tamanu/ui-components';
import { PriceField } from '../../../components/Field/PriceField';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { InvoiceItemActionModal } from '../EditInvoiceModal/InvoiceItemActionModal';

const StyledItemCell = styled(Box)`
  .MuiFormHelperText-root {
    font-size: 14px;
  }
`;

export const ViewOnlyCell = styled.div`
  display: flex;
  font-size: 14px;
  padding-left: 15px;
`;

export const DateCell = ({ index, item, isItemEditable }) => (
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
);

export const DetailsCell = ({
  index,
  item,
  isItemEditable,
  invoiceProductsSuggester,
  handleChangeProduct,
  nonDiscountableTranslation,
  editable,
}) => (
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
        {item.productId && (item.productDiscountable ? '' : ` (${nonDiscountableTranslation})`)}
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
);

export const CodeCell = ({ item }) => (
  <StyledItemCell width="10%">
    <ViewOnlyCell>{item.productCode}</ViewOnlyCell>
  </StyledItemCell>
);

export const QuantityCell = ({ index, item, isItemEditable }) => (
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
);

export const OrderedByCell = ({
  index,
  item,
  isItemEditable,
  practitionerSuggester,
  handleChangeOrderedBy,
}) => (
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
);

const PriceText = styled.span`
  margin-right: 16px;
  padding-left: 15px;
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

const PriceCellContainer = styled.div`
  display: flex;
  gap: 10px;
`;

export const PriceCell = ({
  index,
  item,
  showActionMenu,
  editable,
  isDeleteDisabled,
  formArrayMethods,
}) => {
  // Todo: Determine input state based on productPriceManualEntry when it's implemented
  const hidePriceInput = item.productPrice === null || !editable;
  const { actionModal, onCloseActionModal, handleAction, menuItems } = useInvoiceItemActions({
    item,
    index,
    formArrayMethods,
    isDeleteDisabled,
    hidePriceInput,
  });
  const discountPrice = isNaN(item.productPrice)
    ? undefined
    : getInvoiceItemDiscountPriceDisplay(item);
  const price = getInvoiceItemPriceDisplay(item);

  return (
    <>
      <StyledItemCell width="11%" sx={{ flexGrow: 1 }}>
        <PriceCellContainer>
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
        </PriceCellContainer>
      </StyledItemCell>
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
