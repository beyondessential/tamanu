import React from 'react';
import { Field, DateField, NoteModalActionBlocker } from '../../../../components';
import { CELL_WIDTHS } from '../../constants';
import { DateDisplay } from '@tamanu/ui-components';

export const DateCell = ({ index, item, isEditing, cellWidths = CELL_WIDTHS }) => (
  <td style={{ minInlineSize: cellWidths.DATE }}>
    {isEditing ? (
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
      <DateDisplay date={item?.orderDate} format="shortest" />
    )}
  </td>
);
