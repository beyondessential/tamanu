import React from 'react';

import { Chip } from '@mui/material';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import styled from 'styled-components';
import { DataFetchingTable, TranslatedText } from '../../../../components';

export const StyledDataFetchingTable = styled(DataFetchingTable)`
  border-start-end-radius: 0;
  border-start-start-radius: 0;
  box-shadow: unset;

  .MuiTableCell-body {
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
  &.MuiChip-root {
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
      style={{ color: visibilityStatus === VISIBILITY_STATUSES.CURRENT ? '#19934e' : '#444' }}
      size="small"
      {...props}
    />
  );
}
