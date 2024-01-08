import React from 'react';
import { STATUS_COLOR } from '@tamanu/constants';
import { TableCellTag } from '../../components';
import { ThemedTooltip } from '../../components/Tooltip';

export const ClinicalStatusDisplay = ({ clinicalStatus }) => {
  if (!clinicalStatus || !clinicalStatus?.color) return <></>;
  const { background, color } = STATUS_COLOR[clinicalStatus.color];
  return (
    <ThemedTooltip visible title="Current status">
      <TableCellTag $background={background} $color={color} $position="initial">
        {clinicalStatus.name}
      </TableCellTag>
    </ThemedTooltip>
  );
};
