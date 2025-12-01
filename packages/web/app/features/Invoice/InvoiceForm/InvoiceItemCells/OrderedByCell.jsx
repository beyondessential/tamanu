import React from 'react';
import { AutocompleteField, Field, NoteModalActionBlocker } from '../../../../components';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';

export const OrderedByCell = ({
  index,
  item,
  isItemEditable,
  practitionerSuggester,
  handleChangeOrderedBy,
}) => (
  <ItemCell width="19%" data-testid="styleditemcell-tfvb">
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
  </ItemCell>
);
