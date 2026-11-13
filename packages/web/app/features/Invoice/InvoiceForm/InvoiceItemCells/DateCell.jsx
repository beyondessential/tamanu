import React from 'react';
import { Field, DateField, NoteModalActionBlocker } from '../../../../components';
import { CELL_WIDTHS } from '../../constants';
import { DateDisplay } from '@tamanu/ui-components';

// A section's period limits the dates its items can carry, so an item cannot be given a date
// belonging to another section. A section with no period places no limit.
export const DateCell = ({
  index,
  item,
  isEditing,
  cellWidths = CELL_WIDTHS,
  sectionPeriod,
}) => (
  <td style={{ minInlineSize: cellWidths.DATE }}>
    {isEditing ? (
      <NoteModalActionBlocker>
        <Field
          name={`invoiceItems.${index}.orderDate`}
          required
          component={DateField}
          shortYear
          min={sectionPeriod?.startDate || undefined}
          max={sectionPeriod?.endDate || undefined}
          data-testid="field-e3dv"
        />
      </NoteModalActionBlocker>
    ) : (
      <DateDisplay date={item?.orderDate} format="shortest" />
    )}
  </td>
);
