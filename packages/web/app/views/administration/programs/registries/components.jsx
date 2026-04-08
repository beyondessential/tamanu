import Chip, { chipClasses } from '@mui/material/Chip';
import { tableCellClasses } from '@mui/material/TableCell';
import React from 'react';
import styled from 'styled-components';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { DataFetchingTable, TranslatedText } from '../../../../components';

export const StyledDataFetchingTable = styled(DataFetchingTable)`
  border-start-end-radius: 0;
  border-start-start-radius: 0;
  box-shadow: unset;

  .${tableCellClasses.body} {
    padding-block: 16px;
  }
`;

export function ColourCell({ color }) {
  return color || <>&mdash;</>;
}

export function VisibilityStatusCell({ visibilityStatus }) {
  return visibilityStatus || <>&mdash;</>;
}

const visibilityStatusText = /** @type {const} */ {
  [VISIBILITY_STATUSES.CURRENT]: (
    <TranslatedText
      stringId="admin.programRegistries.visibilityStatus.current"
      fallback="Current"
    />
  ),
  [VISIBILITY_STATUSES.HISTORICAL]: (
    <TranslatedText
      stringId="admin.programRegistries.visibilityStatus.historical"
      fallback="Historical"
    />
  ),
  [VISIBILITY_STATUSES.MERGED]: (
    <TranslatedText stringId="admin.programRegistries.visibilityStatus.merged" fallback="Merged" />
  ),
};

const StyledChip = styled(Chip)`
  &.${chipClasses.root} {
    background-color: oklch(from currentColor l c h / 10%);
  }
`;

export function VisibilityStatusChip({ visibilityStatus, ...props }) {
  if (!visibilityStatus) return null;
  return (
    <StyledChip
      label={
        visibilityStatusText[visibilityStatus] ?? (
          <TranslatedText
            stringId="admin.programRegistries.visibilityStatus.unknown"
            fallback="Unknown"
          />
        )
      }
      style={{
        color:
          visibilityStatus === VISIBILITY_STATUSES.CURRENT
            ? TAMANU_COLORS.green
            : TAMANU_COLORS.darkestText,
      }}
      size="small"
      {...props}
    />
  );
}
