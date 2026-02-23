import React from 'react';
import { Field, NumberField, NoteModalActionBlocker } from '../../../../components';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';
import { CELL_WIDTHS } from '../../constants';

export const QuantityCell = ({ index, item, isItemEditable, cellWidths = CELL_WIDTHS }) => (
  <ItemCell $width={cellWidths.QUANTITY}>
    {isItemEditable ? (
      <NoteModalActionBlocker>
        <Field
          name={`invoiceItems.${index}.quantity`}
          component={NumberField}
          min={1}
          max={99}
          onInput={event => {
            if (!event.target.validity.valid) {
              event.target.value = '';
            }
          }}
          required
          data-testid="field-6aku"
        />
      </NoteModalActionBlocker>
    ) : (
      <ViewOnlyCell>{item?.quantity}</ViewOnlyCell>
    )}
  </ItemCell>
);
