import React from 'react';
import styled from 'styled-components';

import { getDrugUnitLabel } from '@tamanu/shared/utils/medication';
import { Field, NoteModalActionBlocker, NumberField } from '../../../../components';
import { useTranslation } from '../../../../contexts/Translation';
import { useDispensingUnit } from '../../../../api/queries';
import { CELL_WIDTHS } from '../../constants';

// With a dispensing unit, the number field gives the number as little as 4ch, so the browser's
// spin buttons cover the end of a 4-digit quantity. 7ch fits 4 digits alongside the spin buttons.
const QuantityField = styled(Field)`
  && .MuiInputBase-root {
    grid-template-columns: minmax(7ch, 8ch) auto;
  }
`;

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
          <QuantityField
            name={`invoiceItems.${index}.quantity`}
            component={NumberField}
            min={1}
            max={9999}
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
