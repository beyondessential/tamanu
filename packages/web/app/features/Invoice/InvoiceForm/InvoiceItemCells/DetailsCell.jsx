import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  AutocompleteField,
  Field,
  TranslatedText,
  NoteModalActionBlocker,
} from '../../../../components';
import { Colors } from '../../../../constants';

const StyledItemCell = styled(Box)`
  .MuiFormHelperText-root {
    font-size: 14px;
  }
`;

const ViewOnlyCell = styled.div`
  display: flex;
  font-size: 14px;
  padding-left: 15px;
`;

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
