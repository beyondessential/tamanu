import React from 'react';
import { Box } from '@material-ui/core';
import {
  AutocompleteField,
  Field,
  TranslatedText,
  NoteModalActionBlocker,
} from '../../../../components';
import { Colors } from '../../../../constants';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';

export const DetailsCell = ({
  index,
  item,
  isItemEditable,
  invoiceProductsSuggester,
  handleChangeProduct,
  editable,
}) => (
  <ItemCell width="28%">
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
      <ViewOnlyCell>{item.product?.name}</ViewOnlyCell>
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
  </ItemCell>
);
