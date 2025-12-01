import React from 'react';
import { Field, NumberField, NoteModalActionBlocker } from '../../../../components';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';

export const QuantityCell = ({ index, item, isItemEditable }) => (
  <ItemCell width="10%" paddingLeft="24px">
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
          size="small"
          required
          data-testid="field-6aku"
        />
      </NoteModalActionBlocker>
    ) : (
      <ViewOnlyCell>{item?.quantity}</ViewOnlyCell>
    )}
  </ItemCell>
);
