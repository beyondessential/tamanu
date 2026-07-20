import React from 'react';
import { AutocompleteField, Field, NoteModalActionBlocker } from '../../../../components';
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
    <td style={{ minInlineSize: cellWidths.ORDERED_BY }}>
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
        item?.orderedByUser?.displayName
      )}
    </td>
  );
};
