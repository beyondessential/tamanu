import React from 'react';
import { Box } from '@material-ui/core';
import styled from 'styled-components';
import {
  AutocompleteField,
  Field,
  TranslatedText,
  NoteModalActionBlocker,
  ThemedTooltip,
} from '../../../../components';
import { Colors } from '../../../../constants';
import { ItemCell } from './ItemCell';
import { ViewOnlyCell } from './ViewOnlyCell';

const Container = styled(ItemCell)`
  flex: 1;
  min-width: 0;
`;

const Cell = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  font-size: 14px;
  padding-right: 10px;
`;

export const DetailsCell = ({
  index,
  item,
  isItemEditable,
  invoiceProductsSuggester,
  handleChangeProduct,
  invoiceIsEditable,
}) => {
  const detailsText = item.productNameFinal || item.product?.name;
  return (
    <Container>
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
        <ThemedTooltip title={detailsText}>
          <Cell>{detailsText}</Cell>
        </ThemedTooltip>
      )}
      {item.note && (
        <Box marginTop={invoiceIsEditable ? '4px' : '-8px'} color={Colors.darkText}>
          <TranslatedText
            stringId="invoice.modal.editInvoice.note.label"
            fallback="Note"
            data-testid="translatedtext-k4c8"
          />
          {`: ${item.note}`}
        </Box>
      )}
    </Container>
  );
};
