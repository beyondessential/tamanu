import Chip, { chipClasses } from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import React from 'react';
import styled from 'styled-components';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { TAMANU_COLORS } from '../constants/colors';
import { TranslatedVisibilityStatus } from './Translation/TranslatedVisibilityStatus';

const StyledChip = styled(Chip).attrs({ size: 'small' })`
  &.${chipClasses.root} {
    background-color: oklch(from currentColor l c h / 10%);
  }
`;

const chipColor = {
  [VISIBILITY_STATUSES.CURRENT]: TAMANU_COLORS.green,
  [VISIBILITY_STATUSES.HISTORICAL]: TAMANU_COLORS.darkestText,
  [VISIBILITY_STATUSES.MERGED]: TAMANU_COLORS.darkestText,
};

export function VisibilityStatusChip({ isLoading, style, visibilityStatus, ...props }) {
  return isLoading ? (
    <Skeleton
      animation="wave"
      aria-busy={isLoading}
      variant="rounded"
      style={{ borderRadius: 'calc(infinity * 1px)', fontSize: 'inherit' }}
    >
      <StyledChip
        label={<TranslatedVisibilityStatus visibilityStatus={VISIBILITY_STATUSES.CURRENT} />}
      />
    </Skeleton>
  ) : (
    <StyledChip
      label={<TranslatedVisibilityStatus visibilityStatus={visibilityStatus} />}
      style={{ ...style, color: chipColor[visibilityStatus] }}
      {...props}
    />
  );
}
