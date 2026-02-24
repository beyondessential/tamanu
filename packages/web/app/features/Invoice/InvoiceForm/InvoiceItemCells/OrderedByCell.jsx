import React from 'react';
import { AutocompleteField, Field, NoteModalActionBlocker } from '../../../../components';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';
import { CELL_WIDTHS } from '../../constants';
import { useSuggester } from '../../../../api';

export const OrderedByCell = ({
  index,
  item,
  isEditing,
  handleChangeOrderedBy,
  cellWidths = CELL_WIDTHS,
}) => {
  const practitionerSuggester = useSuggester('practitioner');

  return (
    <ItemCell $width={cellWidths.ORDERED_BY}>
      {isEditing ? (
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
};
