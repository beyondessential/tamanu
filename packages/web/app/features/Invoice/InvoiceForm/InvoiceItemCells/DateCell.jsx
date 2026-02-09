import React from 'react';
import { Field, DateField, NoteModalActionBlocker } from '../../../../components';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';
import { CELL_WIDTHS } from '../../constants';
import { useDateTimeFormat } from '@tamanu/ui-components';  

export const DateCell = ({ index, item, isItemEditable }) => {
  const { formatShortest } = useDateTimeFormat();
  return (<ItemCell $width={CELL_WIDTHS.DATE}>
    {isItemEditable ? (
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
        {item?.orderDate ? formatShortest(item?.orderDate) : ''}
      </ViewOnlyCell>
    )}
  </ItemCell>
);

}