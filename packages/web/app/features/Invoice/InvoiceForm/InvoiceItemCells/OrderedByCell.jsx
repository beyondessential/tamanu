import React from 'react';
import { AutocompleteField, Field, NoteModalActionBlocker } from '../../../../components';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';
import { CELL_WIDTHS } from '../../constants';

export const OrderedByCell = ({
  index,
  item,
  isItemEditable,
  practitionerSuggester,
  handleChangeOrderedBy,
  cellWidths = CELL_WIDTHS,
}) => (
  <ItemCell $width={cellWidths.ORDERED_BY}>
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
  </ItemCell>
);
