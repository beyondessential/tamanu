import Chip, { chipClasses } from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { tableCellClasses } from '@mui/material/TableCell';
import React from 'react';
import styled from 'styled-components';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { DataFetchingTable, TranslatedText } from '../../../../components';
import { ThreeDotMenu } from '../../../../components/ThreeDotMenu';
import { useVisibilityStatusMutation } from './useVisibilityStatusMutation';

export const StyledDataFetchingTable = styled(DataFetchingTable)`
  border-start-end-radius: 0;
  border-start-start-radius: 0;
  box-shadow: unset;

  .${tableCellClasses.body} {
    padding-block: 16px;
  }
`;

/**
 * @param {'programRegistryClinicalStatus' | 'programRegistryCondition' | 'programRegistryConditionCategory'} resourceSegment
 */
export function createProgramRegistryRowActionsAccessor(resourceSegment) {
  return function ProgramRegistryRowActionsCell({ id, refreshTable, visibilityStatus }) {
    const { isLoading, mutateAsync } = useVisibilityStatusMutation();

    const updateVisibilityStatus = nextVisibilityStatus =>
      mutateAsync(
        {
          recordId: id,
          resourceSegment,
          visibilityStatus: nextVisibilityStatus,
        },
        { onSuccess: () => refreshTable?.() },
      );

    const items = [
      {
        label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
      },
    ];

    if (visibilityStatus === VISIBILITY_STATUSES.CURRENT) {
      items.push({
        disabled: isLoading,
        label: (
          <TranslatedText
            stringId="admin.programRegistries.table.action.makeHistorical"
            fallback="Make historical"
          />
        ),
        onClick: () => updateVisibilityStatus(VISIBILITY_STATUSES.HISTORICAL),
      });
    } else if (visibilityStatus === VISIBILITY_STATUSES.HISTORICAL) {
      items.push({
        disabled: isLoading,
        label: (
          <TranslatedText
            stringId="admin.programRegistries.table.action.makeCurrent"
            fallback="Make current"
          />
        ),
        onClick: () => updateVisibilityStatus(VISIBILITY_STATUSES.CURRENT),
      });
    }

    return <ThreeDotMenu items={items} />;
  };
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

const chipColor = {
  [VISIBILITY_STATUSES.CURRENT]: TAMANU_COLORS.green,
  [VISIBILITY_STATUSES.HISTORICAL]: TAMANU_COLORS.darkestText,
  [VISIBILITY_STATUSES.MERGED]: TAMANU_COLORS.darkestText,
};

export function VisibilityStatusChip({ isLoading, visibilityStatus, ...props }) {
  return isLoading ? (
    <Skeleton animation="wave" variant="rounded" style={{ borderRadius: 'calc(infinity * 1px)' }}>
      <StyledChip
        label={
          <TranslatedText
            stringId="admin.programRegistries.visibilityStatus.current"
            fallback="Current"
          />
        }
        size="small"
      />
    </Skeleton>
  ) : (
    <StyledChip
      label={
        visibilityStatusText[visibilityStatus] ?? (
          <TranslatedText
            stringId="admin.programRegistries.visibilityStatus.unknown"
            fallback="Unknown"
          />
        )
      }
      style={{ color: chipColor[visibilityStatus] }}
      size="small"
      {...props}
    />
  );
}

const emptyCell = <em style={{ color: TAMANU_COLORS.softText }}>None</em>;

export function ColourCell({ color }) {
  return color || emptyCell;
}

export function VisibilityStatusCell({ visibilityStatus }) {
  return visibilityStatus ? (
    <VisibilityStatusChip visibilityStatus={visibilityStatus} />
  ) : (
    emptyCell
  );
}
