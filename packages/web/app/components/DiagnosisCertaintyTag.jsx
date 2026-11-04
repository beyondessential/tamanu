import React from 'react';

import { DIAGNOSIS_CERTAINTY_CONFIG, DIAGNOSIS_CERTAINTY_LABELS } from '@tamanu/constants';
import { Colors } from '../constants/styles';
import { TableCellTag } from './Tag';
import { TranslatedEnum } from './Translation';

// Certainty is only validated by the application, so a diagnosis may hold a value with no colour of
// its own.
export const DiagnosisCertaintyTag = ({ certainty, 'data-testid': dataTestId }) => (
  <TableCellTag
    $color={DIAGNOSIS_CERTAINTY_CONFIG[certainty]?.color ?? Colors.midText}
    noWrap
    data-testid={dataTestId}
  >
    <TranslatedEnum
      value={certainty}
      enumValues={DIAGNOSIS_CERTAINTY_LABELS}
      data-testid="translatedenum-certainty"
    />
  </TableCellTag>
);
