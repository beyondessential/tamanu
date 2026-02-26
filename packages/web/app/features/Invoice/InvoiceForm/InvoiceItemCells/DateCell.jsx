import React from 'react';
import { Field, DateField, NoteModalActionBlocker } from '../../../../components';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';
import { CELL_WIDTHS } from '../../constants';
import { DateDisplay } from '@tamanu/ui-components';  

export const DateCell = ({ index, item, isItemEditable }) => {
  return (<ItemCell $width={CELL_WIDTHS.DATE}>
    {isItemEditable ? (
      <NoteModalActionBlocker>
        <Field
          name={`invoiceItems.${index}.orderDate`}
          required
          component={DateField}
          shortYear
          data-testid="field-e3dv"
          />
      </NoteModalActionBlocker>
    ) : (
      <ViewOnlyCell>
        <DateDisplay date={item?.orderDate} format="shortest" />
      </ViewOnlyCell>
    )}
  </ItemCell>
);

}