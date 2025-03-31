import React from 'react';
import { STATUS_COLOR } from '@tamanu/constants';
import { TableCellTag, TranslatedText, TranslatedReferenceData } from '../../components';
import { ThemedTooltip } from '../../components/Tooltip';

export const ClinicalStatusDisplay = ({ clinicalStatus }) => {
  if (!clinicalStatus) return <></>;
  const color = STATUS_COLOR[clinicalStatus.color];
  return (
    <ThemedTooltip
      visible
      title={
        <TranslatedText
          stringId="programRegistry.currentStatus.tooltip"
          fallback="Current status"
          data-testid='translatedtext-oxvo' />
      }
    >
      <TableCellTag $color={color} $position="initial">
        <TranslatedReferenceData
          fallback={clinicalStatus?.name}
          value={clinicalStatus?.id}
          category="programRegistryClinicalStatus"
          placeholder={
            <TranslatedText
              stringId="programRegistry.currentStatus.placeholder"
              fallback="n/a"
              data-testid='translatedtext-hywd' />
          }
          data-testid='translatedreferencedata-0ct9' />
      </TableCellTag>
    </ThemedTooltip>
  );
};
