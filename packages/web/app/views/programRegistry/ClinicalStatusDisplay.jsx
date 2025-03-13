import React from 'react';
import { STATUS_COLOR } from '@tamanu/constants';
import { TableCellTag, TranslatedReferenceData } from '../../components';
import { ThemedTooltip } from '../../components/Tooltip';

export const ClinicalStatusDisplay = ({ clinicalStatus }) => {
  if (!clinicalStatus) return <></>;
  const color = STATUS_COLOR[clinicalStatus.color];
  return (
    <ThemedTooltip visible title="Current status">
      <TableCellTag $color={color} $position="initial">
        <TranslatedReferenceData
          fallback={clinicalStatus?.name}
          value={clinicalStatus?.id}
          category="programRegistryClinicalStatus"
          placeholder="n/a"
        />
      </TableCellTag>
    </ThemedTooltip>
  );
};
