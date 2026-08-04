import React from 'react';

import { getDrugUnitLabel } from '@tamanu/shared/utils/medication';
import { Field, NoteModalActionBlocker, NumberField } from '../../../../components';
import { useTranslation } from '../../../../contexts/Translation';
import { useDispensingUnit } from '../../../../api/queries';
import { CELL_WIDTHS } from '../../constants';

export const QuantityCell = ({ index, item, isEditing, cellWidths = CELL_WIDTHS }) => {
  const { getEnumTranslation } = useTranslation();
  // sourcePrescription covers saved prescription-sourced items; dispensingUnit covers
  // drug products newly selected in the add items form.
  const localDispensingUnit = item?.sourcePrescription?.dispensingUnit ?? item?.dispensingUnit;
  // A manually-added drug product reloaded when editing a saved invoice has neither, so fall
  // back to fetching the unit from its source drug (sourceRecordId is the drug reference id).
  const { data: fallbackDispensingUnit } = useDispensingUnit(item?.product?.sourceRecordId, {
    enabled: Boolean(localDispensingUnit),
  });
  const dispensingUnit = localDispensingUnit ?? fallbackDispensingUnit;
  return (
    <td style={{ minInlineSize: cellWidths.QUANTITY }}>
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
            unit={
              dispensingUnit
                ? getDrugUnitLabel(dispensingUnit, item?.quantity, getEnumTranslation)
                : undefined
            }
            required
            data-testid="field-6aku"
          />
        </NoteModalActionBlocker>
      ) : (
        <>
          {item?.quantity}
          {dispensingUnit &&
            ` ${getDrugUnitLabel(dispensingUnit, item?.quantity, getEnumTranslation)}`}
        </>
      )}
    </td>
  );
};
