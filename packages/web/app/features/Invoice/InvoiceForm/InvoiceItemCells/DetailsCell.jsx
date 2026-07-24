import React from 'react';
import styled from 'styled-components';

import {
  AutocompleteField,
  Field,
  ThemedTooltip,
  TranslatedText,
  useSuggester,
} from '@tamanu/ui-components';
import { NoteModalActionBlocker } from '../../../../components';

const StyledField = styled(Field)`
  max-width: 500px;
`;

const ClampedText = styled.div`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  display: -webkit-box;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Note = styled.div`
  color: ${p => p.theme.palette.text.secondary};
  padding-block-start: 0.25em;
`;

const invoiceProductSuggesterFormatter = ({ dispensingUnit, id, name, sourceRecordId }) => ({
  dispensingUnit,
  sourceRecordId,
  label: name,
  value: id,
});

export const DetailsCell = ({
  cellWidths,
  index,
  item,
  handleChangeProduct,
  isEditing,
  isSaved,
  priceListId,
}) => {
  const invoiceProductsSuggester = useSuggester('invoiceProduct', {
    formatter: invoiceProductSuggesterFormatter,
    baseQueryParameters: { priceListId },
  });
  const detailsText = item.productNameFinal || item.product?.name;
  return (
    <td style={{ minInlineSize: cellWidths.DETAILS }}>
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
          <ClampedText>{detailsText}</ClampedText>
        </ThemedTooltip>
      )}
      {!isEditing && isSaved && item.note && (
        <Note>
          <TranslatedText stringId="invoice.modal.editInvoice.note.label" fallback="Note" />
          {`: ${item.note}`}
        </Note>
      )}
    </td>
  );
};
