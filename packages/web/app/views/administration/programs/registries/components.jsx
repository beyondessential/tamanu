import { tableCellClasses } from '@mui/material/TableCell';
import React from 'react';
import styled from 'styled-components';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { DataFetchingTable, TranslatedText } from '../../../../components';
import { ThreeDotMenu } from '../../../../components/ThreeDotMenu';
import { useVisibilityStatusMutation } from './useVisibilityStatusMutation';

export const StyledDataFetchingTable = styled(DataFetchingTable).attrs({
  allowExport: false,
})`
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

export function ColourCell({ color }) {
  return (
    color || (
      <em style={{ color: TAMANU_COLORS.softText }}>
        <TranslatedText stringId="general.none" fallback="None" />
      </em>
    )
  );
}
