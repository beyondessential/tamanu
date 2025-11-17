import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
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

export const StyledItemCell = styled(Box)`
  .MuiFormHelperText-root {
    font-size: 14px;
  }

  .MuiTextField-root {
    margin-top: -4px;
    margin-bottom: -5px;
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
        {item.product?.name}
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
    <ViewOnlyCell>{item.product?.sourceRefDataRecord?.code}</ViewOnlyCell>
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
          onChange={handleChangeOrderedBy}
          data-testid="field-xin4"
        />
      </NoteModalActionBlocker>
    ) : (
      <ViewOnlyCell>{item?.orderedByUser?.displayName}</ViewOnlyCell>
    )}
  </StyledItemCell>
);
