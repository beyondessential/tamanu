import React from 'react';
import { Field, NumberField, NoteModalActionBlocker } from '../../../../components';
import { ViewOnlyCell } from './ViewOnlyCell';
import { ItemCell } from './ItemCell';
import { CELL_WIDTHS } from '../../constants';
import { useTranslation } from '../../../../contexts/Translation';
import { getDrugUnitLabel } from '../../../../utils/medications';

export const QuantityCell = ({ index, item, isEditing, cellWidths = CELL_WIDTHS }) => {
  const { getEnumTranslation } = useTranslation();
  const dispensingUnit = item?.sourcePrescription?.dispensingUnit;
  return (
    <ItemCell $width={cellWidths.QUANTITY}>
      {isEditing ? (
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
        <ViewOnlyCell>
          {item?.quantity}
          {dispensingUnit && ` ${getDrugUnitLabel(dispensingUnit, item?.quantity, getEnumTranslation)}`}
        </ViewOnlyCell>
      )}
    </ItemCell>
  );
};
