import React from 'react';
import { STATUS_COLOR } from '@tamanu/constants';
import { TableCellTag } from '../../components';

export const ClinicalStatusDisplay = ({ clinicalStatus }) => {
  const { background, color } = STATUS_COLOR[clinicalStatus.color];
  return (
    <TableCellTag $background={background} $color={color} $position="initial">
      {clinicalStatus.name}
    </TableCellTag>
  );
};
