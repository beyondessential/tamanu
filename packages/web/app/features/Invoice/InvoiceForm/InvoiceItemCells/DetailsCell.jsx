import React from 'react';
import { Box } from '@material-ui/core';
import styled from 'styled-components';
import { useSuggester } from '@tamanu/ui-components';
import {
  AutocompleteField,
  Field,
  TranslatedText,
  NoteModalActionBlocker,
  ThemedTooltip,
} from '../../../../components';
import { Colors } from '../../../../constants';
import { ItemCell } from './ItemCell';

const Container = styled(ItemCell)`
  flex: 1;
  min-width: 0;
`;

const StyledField = styled(Field)`
  max-width: 500px;
`;

const Cell = styled.span`
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  padding-right: 10px;
  font-size: 14px;
`;

const CellText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

export const DetailsCell = ({
  index,
  item,
  handleChangeProduct,
  isEditing,
  isSaved,
  priceListId,
}) => {
  const invoiceProductsSuggester = useSuggester('invoiceProduct', {
    formatter: ({ name, id }) => ({
      label: name,
      value: id,
    }),
    baseQueryParameters: { priceListId },
  });
  const detailsText = item.productNameFinal || item.product?.name;
  return (
    <Container>
      {isEditing ? (
        <NoteModalActionBlocker>
          <StyledField
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
          <Cell>
            <CellText>{detailsText}</CellText>
          </Cell>
        </ThemedTooltip>
      )}
      {!isEditing && isSaved && item.note && (
        <Box color={Colors.darkText}>
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
