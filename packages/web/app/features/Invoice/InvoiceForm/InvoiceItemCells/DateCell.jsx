import React from 'react';
import { Field, DateField, getDateDisplay, NoteModalActionBlocker } from '../../../../components';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';
import { CELL_WIDTHS } from '../../constants';

export const DateCell = ({ index, item, isEditing, cellWidths = CELL_WIDTHS }) => (
  <ItemCell $width={cellWidths.DATE}>
    {isEditing ? (
      <NoteModalActionBlocker>
        <Field
          name={`invoiceItems.${index}.orderDate`}
          required
          component={DateField}
          saveDateAsString
          shortYear
          data-testid="field-e3dv"
        />
      </NoteModalActionBlocker>
    ) : (
      <ViewOnlyCell>
        {item?.orderDate ? getDateDisplay(item?.orderDate, { shortYear: true }) : ''}
      </ViewOnlyCell>
    )}
  </ItemCell>
);
