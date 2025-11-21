import React from 'react';
import { Field, DateField, getDateDisplay, NoteModalActionBlocker } from '../../../../components';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';

export const DateCell = ({ index, item, isItemEditable }) => (
  <ItemCell width="14%">
    {isItemEditable ? (
      <NoteModalActionBlocker>
        <Field
          name={`invoiceItems.${index}.orderDate`}
          required
          component={DateField}
          saveDateAsString
          data-testid="field-e3dv"
        />
      </NoteModalActionBlocker>
    ) : (
      <ViewOnlyCell>
        {item?.orderDate ? getDateDisplay(item?.orderDate, 'dd/MM/yyyy') : ''}
      </ViewOnlyCell>
    )}
  </ItemCell>
);
